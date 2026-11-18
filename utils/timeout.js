const { MessageFlags, PermissionsBitField } = require('discord.js');
const { error } = require('./response');
const { MAX_TIMEOUT, parseDuration, formatDuration, hierarchyError, botPermissionError, cleanReason, logCase, notifyUser, actionEmbed, privateError } = require('./mod');

/**
 * Shared implementation of /mute and /timeout (both use Discord's member timeout).
 * @param {'mute'|'timeout'} type
 * @param {string|null} durationInput  raw duration string; null means the maximum (28 days)
 */
async function runTimeout(interaction, type, durationInput) {
    const fail = (text, hint) => interaction.reply({ embeds: [error(text, hint)], flags: MessageFlags.Ephemeral });
    if (!interaction.inGuild()) return fail('This command only works in a server.');
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail('You need the **Timeout Members** permission.');

    const botError = botPermissionError(interaction, PermissionsBitField.Flags.ModerateMembers, 'Timeout Members');
    if (botError) return fail(botError);

    const user = interaction.options.getUser('user');
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');
    if (!member) return fail(`${user} is not in this server.`);

    const parsed = durationInput == null ? MAX_TIMEOUT : parseDuration(durationInput);
    if (!parsed) return fail('Invalid duration.', 'Use a format like `10m`, `1h30m`, `2d` or `1w`.');
    if (parsed > MAX_TIMEOUT) return fail('Duration can be at most 28 days.');
    if (parsed < 5000) return fail('Duration must be at least 5 seconds.');
    // Stay a minute under Discord's cap so clock skew can't push a "28d" timeout over the limit.
    const duration = Math.min(parsed, MAX_TIMEOUT - 60000);

    const blocked = hierarchyError(interaction, member);
    if (blocked) return fail(blocked);
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail('Members with Administrator cannot be timed out.');

    await interaction.deferReply();
    try {
        await member.timeout(duration, `${interaction.user.username}: ${cleanReason(reason)}`);
    } catch (e) {
        return privateError(interaction, error(`I couldn't time out ${user}.`, 'Check my permissions and role position.'));
    }

    const dmSent = await notifyUser(user, interaction.guild, type === 'mute' ? 'muted' : 'timed out', reason, formatDuration(duration));
    const record = await logCase({ guild: interaction.guild, user, moderator: interaction.user, type, reason, duration });

    return interaction.editReply({
        embeds: [actionEmbed({
            title: type === 'mute' ? '🔇 Member muted' : '⏳ Member timed out',
            target: user,
            moderator: interaction.user,
            reason,
            duration,
            caseNumber: record.case,
            dmSent
        })]
    });
}

module.exports = { runTimeout };
