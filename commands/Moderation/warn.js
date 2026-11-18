const { MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('../../utils/response');
const infraction = require('../../models/infraction');
const { perms, hierarchyError, logCase, notifyUser, actionEmbed } = require('../../utils/mod');

module.exports = {
    data: {
        name: 'warn',
        description: 'Warn a member and record it (Requires Timeout Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to warn'
        }, {
            name: 'reason', type: 3, required: true, max_length: 500, description: 'Why they are being warned'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ModerateMembers),
    permissions: ['MODERATE_MEMBERS'],

    run: async (client, interaction) => {
        const fail = (text, hint) => interaction.reply({ embeds: [error(text, hint)], flags: MessageFlags.Ephemeral });
        if (!interaction.inGuild()) return fail('This command only works in a server.');
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail('You need the **Timeout Members** permission.');

        const user = interaction.options.getUser('user');
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        if (!member) return fail(`${user} is not in this server.`);
        if (user.bot) return fail("Bots can't be warned.");

        const blocked = hierarchyError(interaction, member);
        if (blocked) return fail(blocked);

        await interaction.deferReply();
        const record = await logCase({ guild: interaction.guild, user, moderator: interaction.user, type: 'warn', reason });
        const dmSent = await notifyUser(user, interaction.guild, 'warned', reason);
        const total = await infraction.countDocuments({ guild: interaction.guildId, user: user.id, type: 'warn' });

        const embed = actionEmbed({ title: '⚠️ Member warned', target: user, moderator: interaction.user, reason, caseNumber: record.case, dmSent })
            .setColor(0xEF6C00)
            .addFields({ name: 'Total warnings', value: `${total}`, inline: true });
        return interaction.editReply({ embeds: [embed] });
    }
};
