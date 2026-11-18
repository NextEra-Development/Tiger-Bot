const { PermissionsBitField } = require('discord.js');
const { perms } = require('../../utils/mod');
const { runTimeout } = require('../../utils/timeout');

module.exports = {
    data: {
        name: 'mute',
        description: 'Mute a member until unmuted, up to 28 days (Requires Timeout Members)',
        options: [{
            name: 'user', type: 6, required: true, description: 'The member to mute'
        }, {
            name: 'reason', type: 3, required: false, max_length: 500, description: 'Why they are being muted'
        }, {
            name: 'duration', type: 3, required: false, max_length: 20, description: 'Optional, e.g. 1h or 3d. Defaults to 28 days (the maximum)'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ModerateMembers),
    permissions: ['MODERATE_MEMBERS'],

    run: async (client, interaction) => runTimeout(interaction, 'mute', interaction.options.getString('duration'))
};
