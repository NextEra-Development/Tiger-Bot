const { PermissionsBitField } = require('discord.js');
const { perms } = require('../../utils/mod');
const { runTimeout } = require('../../utils/timeout');

module.exports = {
    data: {
        name: 'timeout',
        description: 'Time out a member for a set duration (Requires Timeout Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to time out'
        }, {
            name: 'duration', type: 3, required: true, max_length: 20, description: 'How long, e.g. 10m, 1h30m, 2d (max 28d)'
        }, {
            name: 'reason', type: 3, required: false, max_length: 500, description: 'Why they are being timed out'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ModerateMembers),
    permissions: ['MODERATE_MEMBERS'],

    run: async (client, interaction) => runTimeout(interaction, 'timeout', interaction.options.getString('duration'))
};
