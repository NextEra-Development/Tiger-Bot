const { PermissionsBitField } = require('discord.js');
const guildConfig = require('../models/guildConfig');

/**
 * Gives the guild's configured autoroles to a (non-bot, non-pending) member.
 * Roles that are missing, managed, or above the bot's highest role are skipped.
 */
async function applyAutoroles(member) {
    try {
        if (member.user.bot || member.pending) return;

        const data = await guildConfig.findOne({ id: member.guild.id }).select('autorole').lean();
        if (!data?.autorole?.length) return;

        const me = member.guild.members.me;
        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;

        const roles = data.autorole
            .map(id => member.guild.roles.cache.get(id))
            .filter(role => role && !role.managed && role.position < me.roles.highest.position && !member.roles.cache.has(role.id));

        if (roles.length) await member.roles.add(roles, 'Autorole');
    } catch (e) {
        console.log('[autorole] failed to add roles:', e);
    }
}

module.exports = { applyAutoroles };
