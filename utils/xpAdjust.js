const { MessageFlags, PermissionsBitField } = require('discord.js');
const users = require('../models/user_xp');
const { success, error } = require('./response');
const { levelForXP } = require('./xp');

/**
 * Shared implementation of /give-xp and /remove-xp. `sign` is 1 or -1.
 */
async function adjustXP(interaction, sign) {
    const deny = (text) => interaction.reply({ embeds: [error(text)], flags: MessageFlags.Ephemeral });
    if (!interaction.inGuild()) return deny('This command only works in a server.');
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) return deny('You need the **Manage Server** permission.');

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (user.bot) return deny("Bots don't earn XP.");

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const reply = (embed) => interaction.editReply({ embeds: [embed] });

    const query = { guild: interaction.guildId, user: user.id };
    const current = await users.findOne(query).lean();
    if (sign < 0 && !current?.xp) return reply(error(`${user} has no XP to remove.`));

    const xp = Math.max(0, (current?.xp || 0) + sign * amount);
    const level = levelForXP(xp);
    const before = current?.level || 0;

    await users.findOneAndUpdate(query, { xp, level }, { upsert: true });

    const change = level === before ? `still level **${level}**` : `level **${before}** → **${level}**`;
    return reply(success(
        `${sign > 0 ? 'Gave' : 'Removed'} **${amount.toLocaleString()}** XP ${sign > 0 ? 'to' : 'from'} ${user}. They now have **${xp.toLocaleString()}** XP (${change}).`,
        level > before ? 'Level rewards are not handed out for manual changes; they apply on the next level-up from chatting.' : null
    ));
}

module.exports = { adjustXP };
