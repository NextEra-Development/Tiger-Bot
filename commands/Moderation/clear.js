const { MessageFlags, PermissionsBitField } = require('discord.js');
const { success, error } = require('../../utils/response');
const { perms } = require('../../utils/mod');

module.exports = {
    data: {
        name: 'clear',
        description: 'Bulk delete recent messages in this channel (Requires Manage Messages)',
        options: [{
            name: 'amount', type: 4, required: true, min_value: 1, max_value: 100, description: 'How many messages to delete (1-100)'
        }, {
            name: 'user', type: 6, required: false, description: 'Only delete messages from this user'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ManageMessages),
    permissions: ['MANAGE_MESSAGES'],

    run: async (client, interaction) => {
        const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        if (!interaction.inGuild()) return reply(error('This command only works in a server.'));
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageMessages)) return reply(error('You need the **Manage Messages** permission.'));

        const channel = interaction.channel;
        if (!channel || typeof channel.bulkDelete !== 'function') return reply(error("Messages can't be bulk deleted in this channel."));

        const botPerms = channel.permissionsFor(interaction.guild.members.me);
        if (!botPerms?.has([PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ReadMessageHistory])) {
            return reply(error('I need **Manage Messages** and **Read Message History** in this channel.'));
        }

        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
            let target = amount;
            if (user) {
                const recent = await channel.messages.fetch({ limit: 100 });
                target = recent.filter(m => m.author.id === user.id).first(amount);
                if (!target.length) {
                    return interaction.editReply({ embeds: [error(`No recent messages from ${user} in the last 100 messages.`)] });
                }
            }

            // `true` skips messages older than 14 days, which Discord refuses to bulk delete.
            const deleted = await channel.bulkDelete(target, true);
            const skipped = (Array.isArray(target) ? target.length : amount) - deleted.size;

            return interaction.editReply({
                embeds: [success(
                    `Deleted **${deleted.size}** message(s)${user ? ` from ${user}` : ''}.`,
                    skipped > 0 ? "Fewer than requested: there weren't that many messages, or some were older than 14 days (Discord won't bulk delete those)." : null
                )]
            });
        } catch (e) {
            console.log(e);
            return interaction.editReply({ embeds: [error("I couldn't delete those messages.")] });
        }
    }
};
