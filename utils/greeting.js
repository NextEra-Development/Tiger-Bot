const { AttachmentBuilder, ChannelType, EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const guildConfig = require('../models/guildConfig');
const banner = require('./banner');
const { success, error, info } = require('./response');

// `welcome` and `goodbye` share everything except the config key and wording.
const KINDS = {
    welcome: { key: 'welcome', verb: 'joins', defaultMessage: 'Welcome {mention}, To **{server}**\nNow we are a family of {members}' },
    goodbye: { key: 'leave', verb: 'leaves', defaultMessage: '**{user}** left the server.' }
};

const PLACEHOLDERS = '`{mention}` `{user}` `{server}` `{members}`';

function fillPlaceholders(template, member) {
    return template
        .replace(/\{mention\}/g, member.user.toString())
        .replace(/\{user\}/g, member.user.username)
        .replace(/\{server\}/g, member.guild.name)
        .replace(/\{members\}/g, member.guild.memberCount.toLocaleString());
}

/**
 * Builds the message payload for a member joining or leaving.
 * `settings` is the guildConfig.welcome / guildConfig.leave sub-document.
 */
async function buildPayload(kind, member, settings = {}) {
    const content = fillPlaceholders(settings.message || KINDS[kind].defaultMessage, member).slice(0, 2000);
    const payload = { content, allowedMentions: { users: [member.id] } };

    if (settings.banner !== false && banner.available()) {
        const image = await banner.renderBanner({
            kind,
            avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
            username: member.user.username,
            subtitle: kind === 'goodbye'
                ? `${member.guild.name} • ${member.guild.memberCount.toLocaleString()} members now`
                : `Member #${member.guild.memberCount.toLocaleString()} • ${member.guild.name}`,
            background: settings.background
        });
        if (image) payload.files = [new AttachmentBuilder(image, { name: `${kind}.png` })];
    }

    return payload;
}

/**
 * Event-side sender. Silently does nothing when the feature is off or misconfigured.
 */
async function sendGreeting(kind, member) {
    try {
        const data = await guildConfig.findOne({ id: member.guild.id });
        const settings = data?.[KINDS[kind].key];
        if (!settings || settings.enable !== true || !settings.channel) return;

        const channel = member.guild.channels.cache.get(settings.channel);
        if (!channel?.isTextBased()) return;

        const me = member.guild.members.me;
        const perms = channel.permissionsFor(me);
        if (!perms?.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages])) return;

        const payload = await buildPayload(kind, member, settings);
        if (payload.files && !perms.has(PermissionsBitField.Flags.AttachFiles)) delete payload.files;

        await channel.send(payload);
    } catch (e) {
        console.log(`[${kind}] failed to send message:`, e);
    }
}

/**
 * Creates the /welcome or /goodbye configuration command.
 */
function makeGreetingCommand(kind) {
    const { key, verb } = KINDS[kind];
    const title = kind[0].toUpperCase() + kind.slice(1);

    return {
        data: {
            name: kind,
            description: `Configure the ${kind} message (Requires Manage Server)`,
            options: [{
                name: 'enable',
                type: 1,
                description: `Send a ${kind} message when someone ${verb}`,
                options: [{
                    name: 'channel',
                    type: 7,
                    required: true,
                    description: `Channel for ${kind} messages`,
                    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                }]
            }, {
                name: 'disable',
                type: 1,
                description: `Stop sending ${kind} messages`
            }, {
                name: 'message',
                type: 1,
                description: `Change the ${kind} text`,
                options: [{
                    name: 'text',
                    type: 3,
                    required: true,
                    max_length: 1500,
                    description: 'Placeholders: {mention} {user} {server} {members}. Use \\n for a new line'
                }]
            }, {
                name: 'banner',
                type: 1,
                description: `Turn the ${kind} image banner on or off`,
                options: [{
                    name: 'enabled',
                    type: 5,
                    required: true,
                    description: 'Attach an image banner to the message'
                }]
            }, {
                name: 'background',
                type: 1,
                description: 'Set a custom banner background image (leave empty to reset)',
                options: [{
                    name: 'url',
                    type: 3,
                    required: false,
                    max_length: 500,
                    description: 'Direct https link to a PNG or JPG image'
                }]
            }, {
                name: 'test',
                type: 1,
                description: `Preview the ${kind} message using yourself`
            }, {
                name: 'show',
                type: 1,
                description: `Show the current ${kind} settings`
            }]
        },
        default_member_permissions: new PermissionsBitField([PermissionsBitField.Flags.ManageGuild]).bitfield.toString(),
        permissions: ['MANAGE_GUILD'],

        run: async (client, interaction) => {
            if (!interaction.inGuild()) {
                return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
            }

            if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
                return interaction.reply({ embeds: [error('You need the **Manage Server** permission.')], flags: MessageFlags.Ephemeral });
            }

            const sub = interaction.options.getSubcommand();
            const id = interaction.guildId;
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const reply = (embed) => interaction.editReply({ embeds: [embed] });

            if (sub === 'test') {
                const data = await guildConfig.findOne({ id });
                const payload = await buildPayload(kind, interaction.member, data?.[key] || {});
                payload.allowedMentions = { parse: [] };
                if (!banner.available() && data?.[key]?.banner !== false) {
                    payload.embeds = [info('Banners are enabled but the image library is not installed, so only text is sent.', 'Ask the bot owner to run `npm install @napi-rs/canvas`.')];
                }
                return interaction.editReply(payload);
            }

            if (sub === 'show') {
                const data = await guildConfig.findOne({ id });
                const s = data?.[key] || {};
                const embed = new EmbedBuilder()
                    .setTitle(`${title} settings`)
                    .setColor(0x1565C0)
                    .addFields(
                        { name: 'Status', value: s.enable === true ? 'Enabled' : 'Disabled', inline: true },
                        { name: 'Channel', value: s.channel ? `<#${s.channel}>` : 'Not set', inline: true },
                        { name: 'Banner', value: s.banner === false ? 'Off' : (banner.available() ? 'On' : 'On (library not installed)'), inline: true },
                        { name: 'Background', value: s.background || 'Default gradient' },
                        { name: 'Message', value: (s.message || KINDS[kind].defaultMessage).slice(0, 1024) },
                        { name: 'Placeholders', value: PLACEHOLDERS }
                    );
                return reply(embed);
            }

            let update, text;

            if (sub === 'enable') {
                const channel = interaction.options.getChannel('channel');
                const perms = channel.permissionsFor?.(interaction.guild.members.me);
                if (!perms?.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages])) {
                    return reply(error(`I can't send messages in ${channel}.`, 'Give me View Channel and Send Messages there, then try again.'));
                }
                update = { [`${key}.enable`]: true, [`${key}.channel`]: channel.id };
                text = `${title} messages will be sent in ${channel}.`;
            } else if (sub === 'disable') {
                update = { [`${key}.enable`]: false };
                text = `${title} messages are now disabled.`;
            } else if (sub === 'message') {
                const message = interaction.options.getString('text').replace(/\\n/g, '\n');
                update = { [`${key}.message`]: message };
                text = `${title} message updated.`;
            } else if (sub === 'banner') {
                const enabled = interaction.options.getBoolean('enabled');
                update = { [`${key}.banner`]: enabled };
                text = `${title} banner turned ${enabled ? 'on' : 'off'}.`;
            } else if (sub === 'background') {
                const url = interaction.options.getString('url');
                if (url && !/^https:\/\/\S+$/i.test(url)) {
                    return reply(error('That is not a valid https link.'));
                }
                update = url ? { [`${key}.background`]: url } : { $unset: { [`${key}.background`]: 1 } };
                text = url ? `${title} banner background updated.` : `${title} banner background reset to default.`;
            }

            await guildConfig.findOneAndUpdate({ id }, update, { upsert: true });
            return reply(success(text, `Use \`/${kind} test\` to preview it.`));
        }
    };
}

module.exports = { buildPayload, sendGreeting, makeGreetingCommand };
