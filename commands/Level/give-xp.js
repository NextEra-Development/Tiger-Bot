const { PermissionsBitField } = require('discord.js');
const { perms } = require('../../utils/mod');
const { adjustXP } = require('../../utils/xpAdjust');

module.exports = {
    data: {
        name: 'give-xp',
        description: 'Give XP to a member (Requires Manage Server)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to give XP to'
        }, {
            name: 'amount', type: 4, required: true, min_value: 1, max_value: 1000000, description: 'How much XP to give'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ManageGuild),
    permissions: ['MANAGE_GUILD'],

    run: async (client, interaction) => adjustXP(interaction, 1)
};
