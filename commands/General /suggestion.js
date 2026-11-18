const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const guildConfig = require("../../models/guildConfig")
const suggestions = require("../../models/suggestion")
const { error, success } = require("../../utils/response");

module.exports = {
    data: {
        name: "suggestion",
        description: "Create or reply to suggestions",
        options: [{
            name: "create",
            type: 1,
            description: "Create a suggestion",
            options: [{
                name: "suggestion",
                type: 3,
                required: true,
                description: "The suggesiton you want to give"
            }]
        }, {
            name: "reply",
            type: 1,
            description: "Reply to a suggesiton",
            options: [{
                name: "id",
                type: 3,
                required: true,
                description: "The suggestion to which you want to reply"
            }, {
                name: "status",
                type: 3,
                required: true,
                description: "Set the status of this suggestion",
                choices: [{
                    name: "Accepted",
                    value: "1"
                }, {
                    name: "Rejected",
                    value: "2"
                }]
            }, {
                name: "response",
                type: 3,
                required: true,
                description: "The response to this status"
            }]
        }, {
            name: 'set-channel',
            type: 1,
            description: "Select the suggestion channel",
            options: [{
                name: "channel",
                type: 7,
                required: true,
                description: "The channel where I should send the suggestions"
            }]
        }],
    },
    timeout: 1000,

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const option = interaction.options.getSubcommand(),
            suggestion = interaction.options.getString("suggestion"),
            channel = interaction.options.getChannel("channel"),
            id = interaction.options.getString("id"),
            status = interaction.options.getString("status"),
            response = interaction.options.getString("response"),
            data = await guildConfig.findOne({ id: interaction.guild.id }) || await guildConfig.create({ id: interaction.guild.id }),
            sug = await suggestions.findOne({ message: id }),
            c = interaction.guild.channels.cache.get(data.suggestion);

        if (option === "create") {
            if (!c) return interaction.editReply({
                embeds: [error('The suggestion channel is not set up yet.', 'Ask a moderator to run `/suggestion set-channel`.')]
            });

            const row = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId("suggest_up")
                    .setLabel("⬆ Up Vote")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("suggest_down")
                    .setLabel("⬇ Down Vote")
                    .setStyle(ButtonStyle.Secondary)
            ])

            const msg = await c.send({
                components: [row],
                embeds: [{
                    title: "New Suggestion!",
                    color: 0x0000FF,
                    description: suggestion,
                    fields: [{
                        name: "Up Votes",
                        value: "0",
                        inline: true
                    }, {
                        name: "Down Votes",
                        value: "0",
                        inline: true
                    }, {
                        name: "Status",
                        value: "pending",
                        inline: true
                    }],
                    footer: {
                        text: interaction.user.username,
                        iconURL: interaction.user.displayAvatarURL()
                    }
                }]
            });

            await suggestions.create({
                suggestion,
                user: interaction.user.id,
                message: msg.id,
                channel: c.id,
                guild: interaction.guildId,
                votes: {
                    up: [], down: []
                },
                createdAt: Date.now(),
            });

            msg.embeds[0].fields.push({
                name: "Suggestion ID",
                value: `\`\`\`\n${msg.id}\n\`\`\``,
                inline: true
            });

            msg.edit({
                embeds: msg.embeds
            });

            interaction.editReply({
                embeds: [success('Your suggestion was created.')]
            })
        } else if (option === "reply") {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.editReply({
                embeds: [error('You need Manage Server permission to reply to suggestions.')]
            });

            if (!sug) return interaction.editReply({
                embeds: [error('Invalid suggestion ID.', 'Double-check the ID and try again.')]
            });

            const msg = await interaction.guild.channels.cache.get(sug.channel)?.messages?.fetch(sug.message);

            if (!msg) return interaction.editReply({
                embeds: [error('That suggestion message was deleted.', 'This suggestion can no longer be replied to.')]
            });

            const row = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId("suggest_up")
                    .setLabel("⬆ Up Vote")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("suggest_down")
                    .setLabel("⬇ Down Vote")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            ]);

            msg.embeds[0].fields[2].value = status === "1" ? "<:tick:961414448520781864> Accepted" : "<:cros:961414487859146783> Rejected";
            msg.embeds[0].fields.push({
                name: "Response",
                value: response,
            })

            msg.edit({
                embeds: msg.embeds,
                components: [row]
            });

            interaction.editReply({
                embeds: [success('Suggestion replied.')]
            })
        } else if (option === "set-channel") {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.editReply({
                embeds: [error('You need Manage Server permission to change the suggestion channel.')]
            });

            if (channel.type !== ChannelType.GuildText) return interaction.editReply({
                embeds: [error('Invalid channel type.', 'Please pick a text channel.')]
            });

            await guildConfig.findOneAndUpdate({ id: interaction.guildId }, { suggestion: channel.id });

            interaction.editReply({
                embeds: [success('Suggestion channel set up.', 'New suggestions will now be posted there.')]
            })
        }
    }
}