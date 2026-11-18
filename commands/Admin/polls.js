const { find } = require('node-emoji');
const polls = require("../../models/polls")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionsBitField } = require('discord.js');
const { success, error } = require('../../utils/response');

module.exports = {
    data: {
        name: "poll",
        description: "Manage polls of your server (Requires Manage Server)",
        options: [{
            name: "create",
            type: 1,
            description: "Create a poll",
            options: [{
                name: "question",
                type: 3,
                required: true,
                description: "The question of the poll"
            }, {
                name: "channel",
                type: 7,
                required: true,
                description: "The channel where you want create the poll"
            }, {
                name: "options",
                type: 3,
                required: true,
                description: "The choices of this poll, seprate them by |",
            }, {
                name: "custom-emojis",
                type: 3,
                required: false,
                description: "Custom emojis for the chocies, seprate them by |"
            }]
        }, {
            name: "end",
            type: 1,
            description: "End a poll",
            options: [{
                name: "id",
                type: 3,
                required: true,
                description: "Message ID of the poll"
            }]
        }],
    },
    timeout: 5000,
    default_member_permissions: new PermissionsBitField([PermissionsBitField.Flags.ManageGuild]).bitfield.toString(),
    permissions: ["MANAGE_GUILD"],

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const option = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel("channel");
        const rawOptions = interaction.options.getString("options");
        const cEmojis = interaction.options.getString("custom-emojis") || "";
        const id = interaction.options.getString("id");
        const question = interaction.options.getString("question");
        const poll = await polls.findOne({ message: id });

        if (option === "create") {
            await handleCreatePoll({ client, interaction, channel, rawOptions, cEmojis, question });
        } else if (option === "end") {
            await handleEndPoll(interaction, poll, id);
        }
    }
}

async function handleCreatePoll(params) {
    const { client, interaction, channel, rawOptions, cEmojis, question } = params;
    let _emoji = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴", "🇵", "🇶", "🇷", "🇸", "🇹", "🇺", "🇻", "🇼", "🇽", "🇾", "🇿"];
    let emojis = [];

    const options = parseOptions(rawOptions, cEmojis);
    if (!validateOptions(options.rawOptions)) {
        return sendInvalidOptionsReply(interaction);
    }

    const rows = createMessageActionRows({ guild: interaction.guild, rawOptions: options.rawOptions, cEmojis: options.cEmojis, _emoji, emojis });

    try {
        const v = await sendPollMessage({ channel, question, rawOptions: options.rawOptions, cEmojis: options.cEmojis, emojis, rows });
        await savePollToDatabase({ question, messageId: v.id, channelId: channel.id, guildId: interaction.guildId, emojis });
        sendPollCreatedReply(interaction, v.url);
    } catch (e) {
        sendPollCreationErrorReply(interaction);
    }
}

function parseOptions(rawOptions, cEmojis) {
    return {
        rawOptions: rawOptions.split("|"),
        cEmojis: cEmojis?.trim()?.replace(/ +/g, "")?.split("|")
    };
}

function validateOptions(rawOptions) {
    return rawOptions.length >= 2 && rawOptions.length <= 25;
}

function sendInvalidOptionsReply(interaction) {
    return interaction.editReply({
        embeds: [error('Invalid options.', 'Provide 2 to 25 options separated by `|`.')]
    });
}

function createMessageActionRows({ guild, rawOptions, cEmojis, _emoji, emojis }) {
    const rows = [new ActionRowBuilder()];
    for (let i = 0; i < rawOptions.length; i++) {
        let ind = Math.floor(i / 5);
        emojis.push(fixEmoji(guild, cEmojis[i]) || _emoji[i]);

        const button = new ButtonBuilder()
            .setCustomId(`poll_${emojis[i]}`)
            .setEmoji(emojis[i])
            .setLabel("0")
            .setStyle(ButtonStyle.Secondary);

        rows[ind] ? rows[ind].addComponents(button) : rows[ind] = new ActionRowBuilder().setComponents(button);
    }
    return rows;
}

async function sendPollMessage({ channel, question, rawOptions, cEmojis, emojis, rows }) {
    return await channel.send({
        embeds: [{
            color: 0x0000FF,
            title: question.slice(0, 256),
            description: rawOptions.map((v, i) => `${cEmojis[i] || emojis[i]} ${v}`).join("\n"),
            timestamp: Date.now(),
            footer: {
                text: `Poll Started At`
            }
        }],
        components: rows
    });
}

async function savePollToDatabase({ question, messageId, channelId, guildId, emojis }) {
    await polls.create({
        question,
        message: messageId,
        channel: channelId,
        guild: guildId,
        votes: {},
        voters: [],
        emojis
    });
}

function sendPollCreatedReply(interaction, url) {
    interaction.editReply({
        embeds: [success(`Poll created. Check it [here](${url}).`)]
    });
}

function sendPollCreationErrorReply(interaction) {
    interaction.editReply({
        embeds: [error('Unable to create the poll.', 'Check my permissions in that channel and try again.')]
    });
}

async function handleEndPoll(interaction, poll, id) {
    if (!poll) {
        return interaction.editReply({
            embeds: [error('Invalid poll message ID.', 'Double-check the ID and try again.')]
        });
    }

    if (poll.ended) {
        return interaction.editReply({
            embeds: [error('This poll is already ended.')]
        });
    }

    const msg = await interaction.guild.channels.cache.get(poll.channel).messages.fetch(id);

    if (!msg) {
        return interaction.editReply({
            embeds: [error('Poll message was deleted.', 'This poll can no longer be ended.')]
        });
    }

    const opt = msg.embeds[0].description?.split("\n");
    const x = Object.entries(poll.votes)?.sort((a, b) => b[1] - a[1]);
    let winner = opt.filter(v => v.includes(x[0][0]));

    interaction.editReply({
        embeds: [success('Poll ended.')]
    });

    msg.edit({
        components: [],
        embeds: [{
            title: msg.embeds[0].title,
            color: 0xFF0000,
            description: `**Poll ended**\nThe most voted option got ${x[0][1]} votes and it was:\n${winner}`,
            timestamp: Date.now(),
            footer: {
                text: `Poll Ended At`
            }
        }]
    });

    await polls.findOneAndUpdate({ message: id }, { ended: true });
}

function fixEmoji(guild, emj = "") {
    const e = find(emj)?.emoji;
    const e2 = guild.emojis.cache.find(v => v.toString() === emj);

    return e2?.id || e;
}

