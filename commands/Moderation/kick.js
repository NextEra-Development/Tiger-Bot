const { MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('../../utils/response');
const { perms, hierarchyError, botPermissionError, cleanReason, logCase, notifyUser, actionEmbed, privateError } = require('../../utils/mod');

module.exports = {
    data: {
        name: 'kick',
        description: 'Kick a member from the server (Requires Kick Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to kick'
        }, {
            name: 'reason', type: 3, required: false, max_length: 500, description: 'Why they are being kicked'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.KickMembers),
    permissions: ['KICK_MEMBERS'],

    run: async (client, interaction) => {
        const fail = (text, hint) => interaction.reply({ embeds: [error(text, hint)], flags: MessageFlags.Ephemeral });
        if (!interaction.inGuild()) return fail('This command only works in a server.');
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.KickMembers)) return fail('You need the **Kick Members** permission.');

        const botError = botPermissionError(interaction, PermissionsBitField.Flags.KickMembers, 'Kick Members');
        if (botError) return fail(botError);

        const user = interaction.options.getUser('user');
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        if (!member) return fail(`${user} is not in this server.`);

        const blocked = hierarchyError(interaction, member);
        if (blocked) return fail(blocked);

        await interaction.deferReply();
        const dmSent = await notifyUser(user, interaction.guild, 'kicked', reason);

        try {
            await member.kick(`${interaction.user.username}: ${cleanReason(reason)}`);
        } catch (e) {
            return privateError(interaction, error(`I couldn't kick ${user}.`, 'Check my permissions and role position.'));
        }

        const record = await logCase({ guild: interaction.guild, user, moderator: interaction.user, type: 'kick', reason });
        return interaction.editReply({
            embeds: [actionEmbed({ title: '👢 Member kicked', target: user, moderator: interaction.user, reason, caseNumber: record.case, dmSent })]
        });
    }
};
