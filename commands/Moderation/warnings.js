const { EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { success, error } = require('../../utils/response');
const infraction = require('../../models/infraction');
const { perms, formatDuration } = require('../../utils/mod');

const ICONS = { warn: '⚠️', kick: '👢', ban: '🔨', unban: '✅', mute: '🔇', timeout: '⏳', unmute: '🔊' };

module.exports = {
    data: {
        name: 'warnings',
        description: "View or manage a member's warnings and moderation history (Requires Timeout Members)",
        options: [{
            name: 'list',
            type: 1,
            description: "Show a user's moderation history",
            options: [{ name: 'user', type: 6, required: true, description: 'The user to look up' }]
        }, {
            name: 'remove',
            type: 1,
            description: 'Delete one case by its number',
            options: [{ name: 'case', type: 4, required: true, min_value: 1, description: 'The case number' }]
        }, {
            name: 'clear',
            type: 1,
            description: 'Delete all warnings of a user',
            options: [{ name: 'user', type: 6, required: true, description: 'The user whose warnings to clear' }]
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ModerateMembers),
    permissions: ['MODERATE_MEMBERS'],

    run: async (client, interaction) => {
        const deny = (text) => interaction.reply({ embeds: [error(text)], flags: MessageFlags.Ephemeral });
        if (!interaction.inGuild()) return deny('This command only works in a server.');
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ModerateMembers)) return deny('You need the **Timeout Members** permission.');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reply = (embed) => interaction.editReply({ embeds: [embed] });

        const sub = interaction.options.getSubcommand();
        const guild = interaction.guildId;

        if (sub === 'list') {
            const user = interaction.options.getUser('user');
            const cases = await infraction.find({ guild, user: user.id }).sort({ case: -1 }).lean();
            const warns = cases.filter(c => c.type === 'warn').length;

            const lines = cases.slice(0, 15).map(c => {
                const when = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`;
                const extra = c.duration ? ` (${formatDuration(c.duration)})` : '';
                return `\`#${c.case}\` ${ICONS[c.type] || '•'} **${c.type}**${extra} by <@${c.moderator}> ${when}\n└ ${c.reason}`.slice(0, 300);
            });

            const embed = new EmbedBuilder()
                .setColor(0x1565C0)
                .setAuthor({ name: `${user.username}'s history`, iconURL: user.displayAvatarURL() })
                .setDescription(lines.join('\n') || 'No moderation history. 🎉')
                .setFooter({ text: `${warns} warning(s) • ${cases.length} case(s) total${cases.length > 15 ? ' • showing latest 15' : ''}` });
            return reply(embed);
        }

        if (sub === 'remove') {
            const number = interaction.options.getInteger('case');
            const removed = await infraction.findOneAndDelete({ guild, case: number });
            if (!removed) return reply(error(`Case #${number} doesn't exist.`));
            return reply(success(`Case #${number} (${removed.type} on <@${removed.user}>) was deleted.`));
        }

        // clear
        const user = interaction.options.getUser('user');
        const { deletedCount } = await infraction.deleteMany({ guild, user: user.id, type: 'warn' });
        if (!deletedCount) return reply(error(`${user} has no warnings.`));
        return reply(success(`Cleared ${deletedCount} warning(s) from ${user}.`));
    }
};
