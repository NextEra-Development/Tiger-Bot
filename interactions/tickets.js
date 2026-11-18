const { ChannelType, MessageFlags, PermissionsBitField } = require('discord.js');
const tickets = require('../models/tickets');
const ticket = require('../models/ticket');

module.exports = async (client, interaction) => {
    if (!interaction.isButton() || interaction.customId !== 'ticket_create' || !interaction.guild) return;

    const data = await tickets.findOne({ guild: interaction.guildId, message: interaction.message.id });
    const member = interaction.member;

    if (!data) return;

    const user_tickets = await ticket.find({ panel: data.name, user: interaction.user.id, closed: false }).lean();

    if (data.banned.some(v => member.roles.cache.has(v))) return interaction.reply({ content: "You are banned from the panel", flags: MessageFlags.Ephemeral });
    if (user_tickets.length >= data.max) return interaction.reply({ content: "You already made maximum tickets `(" + data.max + ")` you are allowed to make in this panel", flags: MessageFlags.Ephemeral });

    const overwrites = [{
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
        type: "role"
    }, {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel],
        type: "member"
    }];

    data.moderators.forEach(v => overwrites.push({ id: v, allow: [PermissionsBitField.Flags.ViewChannel], type: "role" }));

    const channel = await interaction.guild.channels.create(`ticket - ${data.index + 1} `, {
        reason: "for ticket system",
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites
    });

    interaction.reply({ content: "ticket is created successfully", flags: MessageFlags.Ephemeral });

    channel.send({ content: `${interaction.user.toString()}, stay patient staff will be arving soon.` });

    interaction.guild.channels.cache.get(data.logs)?.send({
        content: `${data.moderators.map(v => `<@&${v}>`).join(", ")}, A new ticket ( ${channel.toString()} ) was created go check it out`,
        embeds: [{
            title: "New ticket created",
            timestamp: Date.now(),
            fields: [{
                name: "Panel",
                value: data.name,
                inline: true
            }, {
                name: "User",
                value: interaction.user.username,
                inline: true
            }, {
                name: "Ticket",
                value: channel.toString(),
                inline: true
            }]
        }]
    })

    await tickets.findOneAndUpdate({ guild: interaction.guildId, message: interaction.message.id }, { $inc: { index: 1 } });
    await ticket.create({ channel: channel.id, guild: interaction.guildId, user: interaction.user.id, panel: data.name });
}
