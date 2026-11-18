const { MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('../../utils/response');
const { perms, hierarchyError, botPermissionError, cleanReason, logCase, actionEmbed, privateError } = require('../../utils/mod');

module.exports = {
    data: {
        name: 'unmute',
        description: 'Remove a mute or timeout from a member (Requires Timeout Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to unmute'
        }, {
            name: 'reason', type: 3, required: false, max_length: 500, description: 'Why they are being unmuted'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ModerateMembers),
    permissions: ['MODERATE_MEMBERS'],

    run: async (client, interaction) => {
        const fail = (text, hint) => interaction.reply({ embeds: [error(text, hint)], flags: MessageFlags.Ephemeral });
        if (!interaction.inGuild()) return fail('This command only works in a server.');
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail('You need the **Timeout Members** permission.');

        const botError = botPermissionError(interaction, PermissionsBitField.Flags.ModerateMembers, 'Timeout Members');
        if (botError) return fail(botError);

        const user = interaction.options.getUser('user');
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        if (!member) return fail(`${user} is not in this server.`);
        if (!member.isCommunicationDisabled()) return fail(`${user} is not muted or timed out.`);

        const blocked = hierarchyError(interaction, member);
        if (blocked) return fail(blocked);

        await interaction.deferReply();
        try {
            await member.timeout(null, `${interaction.user.username}: ${cleanReason(reason)}`);
        } catch (e) {
            return privateError(interaction, error(`I couldn't unmute ${user}.`));
        }

        const record = await logCase({ guild: interaction.guild, user, moderator: interaction.user, type: 'unmute', reason });
        const embed = actionEmbed({ title: '🔊 Member unmuted', target: user, moderator: interaction.user, reason, caseNumber: record.case })
            .setColor(0x2E7D32);
        return interaction.editReply({ embeds: [embed] });
    }
};
