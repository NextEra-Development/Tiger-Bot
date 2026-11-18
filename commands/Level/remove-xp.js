const { PermissionsBitField } = require('discord.js');
const { perms } = require('../../utils/mod');
const { adjustXP } = require('../../utils/xpAdjust');

module.exports = {
    data: {
        name: 'remove-xp',
        description: 'Remove XP from a member (Requires Manage Server)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to remove XP from'
        }, {
            name: 'amount', type: 4, required: true, min_value: 1, max_value: 1000000, description: 'How much XP to remove'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ManageGuild),
    permissions: ['MANAGE_GUILD'],

    run: async (client, interaction) => adjustXP(interaction, -1)
};
