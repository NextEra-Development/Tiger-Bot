const { MessageFlags, PermissionsBitField } = require('discord.js');
const guildConfig = require('../../models/guildConfig');
const { success, error, info } = require('../../utils/response');
const { perms } = require('../../utils/mod');

const MAX_AUTOROLES = 5;

module.exports = {
    data: {
        name: 'autorole',
        description: 'Roles given automatically to new members (Requires Manage Roles)',
        options: [{
            name: 'add',
            type: 1,
            description: 'Add a role new members will get',
            options: [{ name: 'role', type: 8, required: true, description: 'The role to give on join' }]
        }, {
            name: 'remove',
            type: 1,
            description: 'Stop giving a role to new members',
            options: [{ name: 'role', type: 8, required: true, description: 'The role to remove from autoroles' }]
        }, {
            name: 'list',
            type: 1,
            description: 'Show the current autoroles'
        }, {
            name: 'clear',
            type: 1,
            description: 'Remove all autoroles'
        }]
    },
    default_member_permissions: perms(PermissionsBitField.Flags.ManageRoles),
    permissions: ['MANAGE_ROLES'],

    run: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
        }

        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ embeds: [error('You need the **Manage Roles** permission.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reply = (embed) => interaction.editReply({ embeds: [embed] });
        const sub = interaction.options.getSubcommand();
        const id = interaction.guildId;
        const data = await guildConfig.findOne({ id }).select('autorole').lean();
        const current = (data?.autorole || []).filter(r => interaction.guild.roles.cache.has(r));

        if (sub === 'list') {
            return reply(info(current.length
                ? `New members get: ${current.map(r => `<@&${r}>`).join(', ')}`
                : 'No autoroles are set.', current.length ? null : 'Add one with `/autorole add`.'));
        }

        if (sub === 'clear') {
            await guildConfig.findOneAndUpdate({ id }, { autorole: [] }, { upsert: true });
            return reply(success('All autoroles were removed.'));
        }

        const role = interaction.options.getRole('role');

        if (sub === 'remove') {
            if (!(data?.autorole || []).includes(role.id)) return reply(error(`${role} is not an autorole.`));
            await guildConfig.findOneAndUpdate({ id }, { $pull: { autorole: role.id } });
            return reply(success(`${role} will no longer be given to new members.`));
        }

        // add
        const me = interaction.guild.members.me;
        if (role.id === interaction.guild.id) return reply(error('The @everyone role cannot be an autorole.'));
        if (role.managed) return reply(error(`${role} is managed by an integration and can't be assigned.`));
        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return reply(error('I need the **Manage Roles** permission to give autoroles.'));
        if (role.position >= me.roles.highest.position) return reply(error(`${role} is above my highest role.`, 'Move my role above it and try again.'));
        if (interaction.user.id !== interaction.guild.ownerId && role.position >= interaction.member.roles.highest.position) {
            return reply(error(`${role} is equal to or above your highest role.`));
        }
        if (current.includes(role.id)) return reply(error(`${role} is already an autorole.`));
        if (current.length >= MAX_AUTOROLES) return reply(error(`You can have at most ${MAX_AUTOROLES} autoroles.`));

        await guildConfig.findOneAndUpdate({ id }, { autorole: [...current, role.id] }, { upsert: true });
        return reply(success(`New members will now get ${role}.`, 'Bots are skipped. Members in membership screening get it once they pass.'));
    }
};
