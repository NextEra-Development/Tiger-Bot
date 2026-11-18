const { EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const guildConfig = require('../models/guildConfig');
const infraction = require('../models/infraction');

const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000; // Discord's hard cap on member timeouts.
const UNITS = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };

// Turns the bitfield helper used across commands into the string Discord expects.
const perms = (...flags) => new PermissionsBitField(flags).bitfield.toString();

/**
 * Parses durations such as "10m", "1h30m", "2d", "1w". Returns milliseconds or null.
 */
function parseDuration(input) {
    if (!input) return null;
    const text = input.toLowerCase().replace(/\s+/g, '');
    if (!/^(\d+[smhdw])+$/.test(text)) return null;

    let total = 0;
    for (const [, amount, unit] of text.matchAll(/(\d+)([smhdw])/g)) total += Number(amount) * UNITS[unit];
    return total > 0 ? total : null;
}

function formatDuration(ms) {
    const parts = [];
    for (const [unit, size] of [['d', UNITS.d], ['h', UNITS.h], ['m', UNITS.m], ['s', UNITS.s]]) {
        const value = Math.floor(ms / size);
        if (value) parts.push(`${value}${unit}`);
        ms -= value * size;
    }
    return parts.join(' ') || '0s';
}

/**
 * Returns a human-readable reason why `target` (a GuildMember) cannot be moderated, or null.
 */
function hierarchyError(interaction, target) {
    const { guild, user, client } = interaction;
    const me = guild.members.me;
    const invoker = interaction.member;

    if (target.id === user.id) return "You can't use this on yourself.";
    if (target.id === client.user.id) return "I can't use this on myself.";
    if (target.id === guild.ownerId) return "The server owner can't be moderated.";

    const targetTop = target.roles.highest.position;
    if (user.id !== guild.ownerId && invoker?.roles?.highest && targetTop >= invoker.roles.highest.position) {
        return "That member's highest role is equal to or above yours.";
    }
    if (targetTop >= me.roles.highest.position) {
        return "That member's highest role is equal to or above mine. Move my role higher and try again.";
    }
    return null;
}

/**
 * Returns an error string if the bot lacks `flag` in this guild, else null.
 */
function botPermissionError(interaction, flag, label) {
    return interaction.guild.members.me.permissions.has(flag)
        ? null
        : `I need the **${label}** permission to do that.`;
}

const cleanReason = (reason) => (reason || 'No reason provided').slice(0, 500);

/**
 * Stores an infraction with the next case number for the guild and returns it.
 */
async function logCase({ guild, user, moderator, type, reason, duration }) {
    const config = await guildConfig.findOneAndUpdate(
        { id: guild.id },
        { $inc: { caseCounter: 1 } },
        { new: true, upsert: true }
    );

    return infraction.create({
        guild: guild.id,
        case: config.caseCounter,
        user: user.id,
        moderator: moderator.id,
        type,
        reason: cleanReason(reason),
        duration
    });
}

/**
 * Best-effort DM to the affected user. Never throws.
 */
async function notifyUser(user, guild, action, reason, extra) {
    const embed = new EmbedBuilder()
        .setColor(0xEF6C00)
        .setTitle(`You were ${action} in ${guild.name}`.slice(0, 256))
        .addFields({ name: 'Reason', value: cleanReason(reason) });
    if (extra) embed.addFields({ name: 'Duration', value: extra });

    return user.send({ embeds: [embed] }).then(() => true).catch(() => false);
}

/**
 * Public confirmation embed for a punitive action.
 */
function actionEmbed({ title, target, moderator, reason, caseNumber, duration, dmSent }) {
    const embed = new EmbedBuilder()
        .setColor(0xC62828)
        .setTitle(title)
        .addFields(
            { name: 'User', value: `${target.toString()} (\`${target.id}\`)`, inline: true },
            { name: 'Moderator', value: moderator.toString(), inline: true },
            { name: 'Reason', value: cleanReason(reason) }
        )
        .setTimestamp();

    if (duration) embed.addFields({ name: 'Duration', value: formatDuration(duration), inline: true });
    if (caseNumber != null) embed.setFooter({ text: `Case #${caseNumber}${dmSent === false ? ' • User could not be DMed' : ''}` });

    return embed;
}

/**
 * After a public deferReply, swaps the public "thinking..." for a private error.
 */
async function privateError(interaction, embed) {
    await interaction.deleteReply().catch(() => { });
    return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = {
    MAX_TIMEOUT,
    privateError,
    perms,
    parseDuration,
    formatDuration,
    hierarchyError,
    botPermissionError,
    cleanReason,
    logCase,
    notifyUser,
    actionEmbed
};
