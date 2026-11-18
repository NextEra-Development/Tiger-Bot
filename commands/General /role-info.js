const { EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('../../utils/response');

// Permissions worth calling out; listing all ~40 flags is noise.
const KEY_PERMISSIONS = [
    'Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers',
    'ModerateMembers', 'ManageMessages', 'MentionEveryone', 'ManageWebhooks', 'ViewAuditLog'
];

module.exports = {
    data: {
        name: 'role-info',
        description: 'Show information about a role',
        options: [{
            name: 'role', type: 8, required: true, description: 'The role to look up'
        }]
    },

    run: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
        }

        const role = interaction.options.getRole('role');
        const full = interaction.guild.roles.cache.get(role.id) || role;
        const permissions = new PermissionsBitField(BigInt(full.permissions?.bitfield ?? full.permissions ?? 0));
        const key = permissions.has(PermissionsBitField.Flags.Administrator)
            ? ['Administrator (all permissions)']
            : KEY_PERMISSIONS.filter(p => permissions.has(PermissionsBitField.Flags[p]));
        const created = Math.floor(Number((BigInt(full.id) >> 22n) + 1420070400000n) / 1000);

        const embed = new EmbedBuilder()
            .setColor(full.color || 0x1565C0)
            .setTitle(`Role: ${full.name}`.slice(0, 256))
            .addFields(
                { name: 'Role', value: `<@&${full.id}> (\`${full.id}\`)`, inline: false },
                { name: 'Members', value: `${full.members?.size ?? 'Unknown'}`, inline: true },
                { name: 'Color', value: full.color ? `#${full.color.toString(16).padStart(6, '0').toUpperCase()}` : 'Default', inline: true },
                { name: 'Position', value: `${full.position}`, inline: true },
                { name: 'Hoisted', value: full.hoist ? 'Yes' : 'No', inline: true },
                { name: 'Mentionable', value: full.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Managed', value: full.managed ? 'Yes (integration)' : 'No', inline: true },
                { name: 'Created', value: `<t:${created}:D> (<t:${created}:R>)`, inline: false },
                { name: 'Key permissions', value: key.join(', ') || 'None', inline: false }
            )
            .setFooter({ text: 'Member count only includes cached members' });

        if (typeof full.iconURL === 'function' && full.iconURL()) embed.setThumbnail(full.iconURL());

        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    }
};
