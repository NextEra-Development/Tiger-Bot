const { MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('../../utils/response');
const { perms, hierarchyError, botPermissionError, cleanReason, logCase, notifyUser, actionEmbed, privateError } = require('../../utils/mod');

module.exports = {
    data: {
        name: 'ban',
        description: 'Ban a user from the server, even if they are not a member (Requires Ban Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The user to ban (mention or paste their ID)'
        }, {
            name: 'reason', type: 3, required: false, max_length: 500, description: 'Why they are being banned'
        }, {
            name: 'delete-messages',
            type: 4,
            required: false,
            description: 'Delete their recent messages',
            choices: [
                { name: "Don't delete any", value: 0 },
                { name: 'Previous hour', value: 3600 },
                { name: 'Previous 24 hours', value: 86400 },
                { name: 'Previous 7 days', value: 604800 }
            ]
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
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        const deleteMessageSeconds = interaction.options.getInteger('delete-messages') || 0;

        // Hierarchy only applies to current members; anyone else can be pre-emptively banned.
        if (member) {
            const blocked = hierarchyError(interaction, member);
            if (blocked) return fail(blocked);
        } else if (user.id === interaction.user.id || user.id === client.user.id) {
            return fail("You can't ban that user.");
        }

        await interaction.deferReply();
        const existing = await interaction.guild.bans.fetch({ user: user.id, force: true }).catch(() => null);
        if (existing) return privateError(interaction, error(`${user} is already banned.`));

        const dmSent = member ? await notifyUser(user, interaction.guild, 'banned', reason) : false;

        try {
            await interaction.guild.members.ban(user.id, {
                reason: `${interaction.user.username}: ${cleanReason(reason)}`,
                deleteMessageSeconds
            });
        } catch (e) {
            return privateError(interaction, error(`I couldn't ban ${user}.`, 'Check my permissions and role position.'));
        }

        const record = await logCase({ guild: interaction.guild, user, moderator: interaction.user, type: 'ban', reason });
        return interaction.editReply({
            embeds: [actionEmbed({ title: '🔨 User banned', target: user, moderator: interaction.user, reason, caseNumber: record.case, dmSent: member ? dmSent : undefined })]
        });
    }
};
