const { MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('../../utils/response');
const { perms, botPermissionError, cleanReason, logCase, actionEmbed, privateError } = require('../../utils/mod');

module.exports = {
    data: {
        name: 'unban',
        description: 'Unban a user (Requires Ban Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The banned user (paste their ID)'
        }, {
            name: 'reason', type: 3, required: false, max_length: 500, description: 'Why they are being unbanned'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.BanMembers),
    permissions: ['BAN_MEMBERS'],

    run: async (client, interaction) => {
        const fail = (text, hint) => interaction.reply({ embeds: [error(text, hint)], flags: MessageFlags.Ephemeral });
        if (!interaction.inGuild()) return fail('This command only works in a server.');
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.BanMembers)) return fail('You need the **Ban Members** permission.');

        const botError = botPermissionError(interaction, PermissionsBitField.Flags.BanMembers, 'Ban Members');
        if (botError) return fail(botError);

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply();
        const ban = await interaction.guild.bans.fetch({ user: user.id, force: true }).catch(() => null);
        if (!ban) return privateError(interaction, error(`${user} is not banned.`));

        try {
            await interaction.guild.members.unban(user.id, `${interaction.user.username}: ${cleanReason(reason)}`);
        } catch (e) {
            return privateError(interaction, error(`I couldn't unban ${user}.`));
        }

        const record = await logCase({ guild: interaction.guild, user, moderator: interaction.user, type: 'unban', reason });
        const embed = actionEmbed({ title: '✅ User unbanned', target: user, moderator: interaction.user, reason, caseNumber: record.case })
            .setColor(0x2E7D32);
        return interaction.editReply({ embeds: [embed] });
    }
};
