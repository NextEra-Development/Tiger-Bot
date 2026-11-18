const { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { find } = require('node-emoji');
const menus = require('../models/reactionRole');
const { success, error } = require('../utils/response');

// Short-lived hand-off between the slash command and its modal submit.
const pendingEmoji = new Map();

function setPending(userId, payload) {
    pendingEmoji.set(userId, payload);
    const timer = setTimeout(() => pendingEmoji.delete(userId), 5 * 60 * 1000);
    if (typeof timer.unref === 'function') timer.unref();
}

function buildEmojiModal(roleId) {
    const input = new TextInputBuilder()
        .setCustomId('emoji')
        .setLabel('Emoji for this role')
        .setPlaceholder('Paste an emoji, e.g. 🎮 or <:name:123456789>')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);

    return new ModalBuilder()
        .setCustomId(`menu_emoji_modal:${roleId}`)
        .setTitle('Reaction Role Emoji')
        .addComponents(row);
}

// Custom emoji are stored by id, unicode emoji by their character (matches reaction emoji naming).
function parseEmoji(raw) {
    const value = (raw || '').trim();
    const custom = value.match(/^<a?:[^:]+:(\d+)>$/);
    if (custom) return { id: custom[1], display: value };

    const shortcode = value.match(/^:([^:]+):$/);
    const display = shortcode ? (find(value)?.emoji || value) : value;

    return { id: null, display };
}

async function handleEmojiModal(client, interaction) {
    if (!interaction.customId.startsWith('menu_emoji_modal:')) return;

    const roleId = interaction.customId.split(':')[1];
    const pending = pendingEmoji.get(interaction.user.id);

    if (!pending || pending.roleId !== roleId) {
        return interaction.reply({
            embeds: [error('This request expired.', 'Please run `/menu add-role` again.')],
            flags: MessageFlags.Ephemeral
        });
    }
    pendingEmoji.delete(interaction.user.id);

    const menu = await menus.findOne({ name: pending.name, guild: interaction.guildId });
    const role = interaction.guild.roles.cache.get(roleId);

    if (!menu || !role) {
        return interaction.reply({
            embeds: [error('That role menu or role no longer exists.', 'Please run `/menu add-role` again.')],
            flags: MessageFlags.Ephemeral
        });
    }

    const { id, display } = parseEmoji(interaction.fields.getTextInputValue('emoji'));
    const stored = id || display;

    if (menu.roles.some(v => v.role === roleId) || menu.roles.some(v => v.emoji === stored)) {
        return interaction.reply({
            embeds: [error('That role or emoji is already part of this menu.')],
            flags: MessageFlags.Ephemeral
        });
    }

    menu.roles.push({ role: roleId, emoji: stored });
    await menus.findOneAndUpdate({ name: pending.name, guild: interaction.guildId }, { roles: menu.roles });

    return interaction.reply({
        embeds: [success(`Added role \`${role.name}\` with emoji ${display} for menu \`${menu.name}\`.`)],
        flags: MessageFlags.Ephemeral
    });
}

module.exports = { setPending, buildEmojiModal, handleEmojiModal };
