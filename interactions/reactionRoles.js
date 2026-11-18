const { MessageFlags } = require("discord.js");
const reactionRole = require("../models/reactionRole");

module.exports = async (client, interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith('reaction_role_') || !interaction.guild) return;

    const emoji = interaction?.component?.emoji;
    if (!emoji) return;

    const menu = await reactionRole.findOne({ message: interaction.message.id });
    if (!menu || !menu.roles?.length) return;

    // Only one role can match a given emoji; act on that single role so we reply exactly once.
    const entry = menu.roles.find(v => v.emoji === emoji.id || v.emoji === emoji.name);
    if (!entry) return;

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const role = interaction.guild.roles.cache.get(entry.role);
    if (!member || !role) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            await interaction.editReply({ content: `I removed the **${role.name}** role from you in ${interaction.guild.name}` });
        } else {
            await member.roles.add(role);
            await interaction.editReply({ content: `I gave you the **${role.name}** role in ${interaction.guild.name}` });
        }
    } catch (e) {
        await interaction.editReply({ content: `I was unable to update your role in ${interaction.guild.name}` });
    }
}
