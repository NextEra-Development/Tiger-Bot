const tickets = require('../../models/tickets');
const ticket = require('../../models/ticket');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, CommandInteraction, EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { success, error } = require('../../utils/response');

module.exports = {
    data: {
        name: "ticket",
        description: "Configure your server's tickets / panels (Requires Manage Server)",
        options: [{
            name: "create",
            type: 1,
            description: "Create a ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel you want to create",
                type: 3,
                required: true,
                autocomplete: true
            }]
        }, {
            name: "remove",
            type: 1,
            description: "Remove a ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel you want to remove",
                type: 3,
                required: true,
                autocomplete: true
            }]
        }, {
            name: "start",
            type: 1,
            description: "Start a ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel you want to start",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "channel",
                description: "The channel where you want to start the panel",
                required: true,
                type: 7
            }]
        }, {
            name: "close",
            type: 1,
            description: "Close an open ticket for your discord server",
        }, {
            name: "re-open",
            type: 1,
            description: "Re-open a closed ticket for your discord server",
        }, {
            name: "delete",
            type: 1,
            description: "Delete a ticket for your discord server",
        }, {
            name: "logs-disable",
            type: 1,
            description: "Disable ticket logs for your server",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }]
        }, {
            name: "logs-enable",
            type: 1,
            description: "Enable ticket logs for your server",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "channel",
                type: 7,
                description: "Channel to send ticket logs for your server",
                required: true
            }]
        }, {
            name: "moderator-add",
            type: 1,
            description: "Add a moderator role for your server's ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "role",
                type: 8,
                description: "The role to add as a moderator",
                required: true
            }]
        }, {
            name: "moderator-remove",
            type: 1,
            description: "Remove a moderator role for your server's ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "role",
                type: 8,
                description: "The role to remove from moderator role",
                required: true
            }]
        }, {
            name: "banned-add",
            type: 1,
            description: "Add a banned role for your server's ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "role",
                type: 8,
                description: "The role to add as a banned",
                required: true
            }]
        }, {
            name: "banned-remove",
            type: 1,
            description: "Remove a banned role for your server's ticket panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "role",
                type: 8,
                description: "The role to remove from banned role",
                required: true
            }]
        }, {
            name: "max-ticket",
            type: 1,
            description: "Set maximum number of tickets a user can create in a panel",
            options: [{
                name: "panel-name",
                description: "The name of the panel",
                type: 3,
                required: true,
                autocomplete: true
            }, {
                name: "limit",
                type: 4,
                description: "The number of tickets a user can create",
                required: true
            }]
        }]
    },
    default_member_permissions: new PermissionsBitField([PermissionsBitField.Flags.ManageGuild]).bitfield.toString(),
    permissions: ["MANAGE_GUILD"],

    /**
     *
     * @param {*} client
     * @param {CommandInteraction} interaction
     * @returns
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const command = interaction.options.getSubcommand();
        const commandHandlers = {
            'create': createPanel,
            'remove': removePanel,
            'start': startPanel,
            'close': closeTicket,
            're-open': reopenTicket,
            'delete': deleteTicket,
            'logs-disable': disableLogs,
            'logs-enable': enableLogs,
            'moderator-add': addModerator,
            'moderator-remove': removeModerator,
            'banned-add': addBanned,
            'banned-remove': removeBanned,
            'max-ticket': setMaxTicket
        };

        if (commandHandlers[command]) {
            await commandHandlers[command](interaction);
        } else {
            await interaction.editReply({ embeds: [error('Unknown command.')] });
        }
    }
}

async function createPanel(interaction) {
    const name = interaction.options.getString('panel-name');
    const data = await tickets.findOne({ guild: interaction.guildId, name });
    if (data) {
        return interaction.editReply({ embeds: [error(`You already have a panel with name \`${name}\`.`)] });
    }
    await tickets.create({ name, guild: interaction.guildId });
    interaction.editReply({ embeds: [success(`I created a panel with name \`${name}\`.`, 'Use `/ticket start` to post it in a channel.')] });
}

async function removePanel(interaction) {
    const name = interaction.options.getString('panel-name');
    const data = await tickets.findOne({ guild: interaction.guildId, name });
    if (!data) {
        return interaction.editReply({ embeds: [error(`You do not have a panel with name \`${name}\`.`)] });
    }
    await tickets.findOneAndDelete({ name, guild: interaction.guildId });
    interaction.editReply({ embeds: [success(`I deleted the panel with name \`${name}\`.`)] });
}

async function startPanel(interaction) {
    const name = interaction.options.getString('panel-name');
    const channel = interaction.options.getChannel('channel');
    const data = await tickets.findOne({ guild: interaction.guildId, name });
    if (!data) {
        return interaction.editReply({ embeds: [error(`You do not have a panel with name \`${name}\`.`)] });
    }
    if (channel.type !== ChannelType.GuildText) {
        return interaction.editReply({ embeds: [error('Channel should be a text channel.')] });
    }

    // Public panel send — must stay public.
    const embed = new EmbedBuilder().setTitle(`Panel : ${name}`).setDescription("Click on <a:Ticket7:962175422567702578> to create a ticket").setColor(0x353A3C);
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket_create").setLabel("Create Ticket").setEmoji("962175422567702578").setStyle(ButtonStyle.Primary));

    channel.send({ embeds: [embed], components: [row] }).then(async v => {
        await tickets.findOneAndUpdate({ guild: interaction.guildId, name }, { message: v.id });
        interaction.editReply({ embeds: [success(`Successfully started the panel with name : \`${name}\` in ${channel.toString()}`)] });
    }).catch(e => {
        interaction.editReply({ embeds: [error(`Unable to send the message in ${channel.toString()}.`)] });
    });
}

async function handleTicketOperation(interaction, operation) {
    const ticketData = await ticket.findOne({ guild: interaction.guildId, channel: interaction.channel.id });
    const data = await tickets.findOne({ guild: interaction.guildId, name: ticketData?.panel });
    const member = interaction.guild.members.cache.get(ticketData?.user);

    if (!ticketData || !ticketData.panel) {
        return interaction.editReply({ embeds: [error('This is not a ticket channel.')] });
    }

    await operation(interaction, ticketData, data, member);
}

async function closeTicket(interaction) {
    await handleTicketOperation(interaction, async (interaction, ticketData, data, member) => {
        if (ticketData.closed) {
            return interaction.editReply({ embeds: [error('This ticket is already closed.')] });
        }

        await updateTicketStatus({ interaction, member, data, viewChannel: false, sendMessages: true, logTitle: "Ticket closed", replyMessage: "This ticket is now closed" });
    });
}

async function reopenTicket(interaction) {
    await handleTicketOperation(interaction, async (interaction, ticketData, data, member) => {
        if (!ticketData.closed) {
            return interaction.editReply({ embeds: [error('This ticket is not closed.')] });
        }

        await updateTicketStatus({ interaction, member, data, viewChannel: true, sendMessages: false, logTitle: "Ticket re-opened", replyMessage: "This ticket is now re-opened" });
    });
}

async function deleteTicket(interaction) {
    await handleTicketOperation(interaction, async (interaction, ticketData, data, member) => {
        interaction.editReply({ embeds: [success('This ticket is closed and channel will be deleted in a few seconds.')] });
        await ticket.findOneAndDelete({ channel: interaction.channel.id });
        await new Promise(res => setTimeout(res, 2000));

        interaction.channel.delete().catch(e => {
            interaction.editReply({ embeds: [error('Ticket was deleted from database but I was unable to delete this channel.')] });
        });

        interaction.guild.channels.cache.get(data?.logs)?.send({
            embeds: [{
                title: "Ticket deleted",
                timestamp: Date.now(),
                fields: [
                    { name: "Panel", value: data?.name, inline: true },
                    { name: "User", value: member.user.username, inline: true },
                    { name: "Ticket", value: interaction.channel.toString(), inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: "Moderator", value: interaction.user.username, inline: true }
                ]
            }]
        });
    });
}

async function handleLogOperation(interaction, operation) {
    const name = interaction.options.getString('panel-name');
    const data = await tickets.findOne({ guild: interaction.guildId, name });
    if (!data) {
        return interaction.editReply({ embeds: [error(`You do not have a panel with name \`${name}\`.`)] });
    }

    await operation(interaction, data);
}

async function disableLogs(interaction) {
    await handleLogOperation(interaction, async (interaction, data) => {
        await tickets.findOneAndUpdate({ guild: interaction.guildId, name: data.name }, { logs: "0" });
        interaction.editReply({ embeds: [success('Successfully disabled Ticket logs for this server.')] });
    });
}

async function enableLogs(interaction) {
    await handleLogOperation(interaction, async (interaction, data) => {
        const channel = interaction.options.getChannel('channel');
        if (channel.type !== ChannelType.GuildText) {
            return interaction.editReply({ embeds: [error('Channel should be a text channel.')] });
        }
        await tickets.findOneAndUpdate({ guild: interaction.guildId, name: data.name }, { logs: channel.id });
        interaction.editReply({ embeds: [success('Successfully enabled Ticket logs for this server in ' + channel.toString())] });
    });
}

async function addModerator(interaction) {
    await handleRoleOperation(interaction, 'moderators', 'add', (role, data) => `Successfully added **${role.name}** as a moderator role in the panel \`${data.name}\``);
}

async function removeModerator(interaction) {
    await handleRoleOperation(interaction, 'moderators', 'remove', (role, data) => `Successfully removed **${role.name}** from moderator roles in the panel \`${data.name}\``);
}

async function addBanned(interaction) {
    await handleRoleOperation(interaction, 'banned', 'add', (role, data) => `Successfully added **${role.name}** as a banned role in the panel \`${data.name}\``);
}

async function removeBanned(interaction) {
    await handleRoleOperation(interaction, 'banned', 'remove', (role, data) => `Successfully removed **${role.name}** from banned roles in the panel \`${data.name}\``);
}

async function setMaxTicket(interaction) {
    const name = interaction.options.getString('panel-name');
    const limit = interaction.options.getInteger('limit');
    const data = await tickets.findOne({ guild: interaction.guildId, name });
    if (!data) {
        return interaction.editReply({ embeds: [error(`You do not have a panel with name \`${name}\`.`)] });
    }
    if (limit < 1 || limit > 1000) {
        return interaction.editReply({ embeds: [error("The maximum ticket limit can't be less than 1 or greater than 1000.")] });
    }
    await tickets.findOneAndUpdate({ guild: interaction.guildId, name }, { max: limit });
    interaction.editReply({ embeds: [success(`Successfully set maximum ticket limit to **${limit}** in the panel \`${data.name}\``)] });
}

async function updateTicketStatus({ interaction, member, data, viewChannel, sendMessages, logTitle, replyMessage }) {
    interaction.channel.permissionOverwrites.create(member, {
        VIEW_CHANNEL: viewChannel,
        SEND_MESSAGES: sendMessages,
    });

    await ticket.findOneAndUpdate({ channel: interaction.channel.id }, { closed: !viewChannel });
    interaction.editReply({ embeds: [success(replyMessage)] });

    interaction.guild.channels.cache.get(data?.logs)?.send({
        embeds: [{
            title: logTitle,
            timestamp: Date.now(),
            fields: [
                { name: "Panel", value: data?.name, inline: true },
                { name: "User", value: member.user.username, inline: true },
                { name: "Ticket", value: interaction.channel.toString(), inline: true },
                { name: "\u200b", value: "\u200b", inline: true },
                { name: "Moderator", value: interaction.user.username, inline: true }
            ]
        }]
    });
}

async function handleRoleOperation(interaction, roleType, operation, successMessage) {
    const name = interaction.options.getString('panel-name');
    const role = interaction.options.getRole('role');
    const data = await tickets.findOne({ guild: interaction.guildId, name });
    if (!data) {
        return interaction.editReply({ embeds: [error(`You do not have a panel with name \`${name}\`.`)] });
    }
    const roleList = data[roleType] || [];
    if (operation === 'add' && roleList.includes(role.id)) {
        return interaction.editReply({ embeds: [error(`This role is already a ${roleType.slice(0, -1)} role in the panel \`${data.name}\`.`)] });
    }
    if (operation === 'remove' && !roleList.includes(role.id)) {
        return interaction.editReply({ embeds: [error(`This role is not a ${roleType.slice(0, -1)} role in the panel \`${data.name}\`.`)] });
    }
    const update = operation === 'add' ? { $push: { [roleType]: role.id } } : { $pull: { [roleType]: { $in: role.id } } };
    await tickets.findOneAndUpdate({ guild: interaction.guildId, name }, update);
    interaction.editReply({ embeds: [success(successMessage(role, data))] });
}
