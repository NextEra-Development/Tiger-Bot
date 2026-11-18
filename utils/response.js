const { EmbedBuilder } = require('discord.js');

// Consistent, numeric colours for short-lived status replies.
const COLORS = {
    success: 0x2E7D32,
    error: 0xC62828,
    info: 0x1565C0,
    warn: 0xEF6C00
};

function build(kind, title, text, hint) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(text)
        .setColor(COLORS[kind]);

    if (hint) embed.addFields({ name: 'Next step', value: hint });

    return embed;
}

module.exports = {
    success: (text, hint) => build('success', '✅ Success', text, hint),
    error: (text, hint) => build('error', '❌ Something went wrong', text, hint),
    info: (text, hint) => build('info', 'ℹ️ Information', text, hint),
    warn: (text, hint) => build('warn', '⚠️ Heads up', text, hint)
};
