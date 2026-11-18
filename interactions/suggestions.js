const { MessageFlags } = require("discord.js");
const suggestion = require("../models/suggestion");

module.exports = async (client, interaction) => {
    if (!interaction.isButton() || (interaction.customId !== 'suggest_up' && interaction.customId !== 'suggest_down')) return;

    const sug = await suggestion.findOne({ message: interaction.message?.id });

    if (!sug) return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (sug.votes.up.includes(interaction.user.id) || sug.votes.down.includes(interaction.user.id)) return interaction.editReply({
        embeds: [{
            color: 0xFF0000,
            title: "❌ Already voted"
        }]
    });

    sug.votes[interaction.customId === "suggest_up" ? "up" : "down"]?.push(interaction.user.id);
    await suggestion.findOneAndUpdate({ message: sug.message }, sug);

    interaction.editReply({
        embeds: [{
            color: 0x00FF00,
            title: "✅ Voted Successfully"
        }]
    });
    const msg = await interaction.channel.messages.fetch(sug.message);

    if (!msg) return;

    msg.embeds[0].fields[0].value = sug.votes.up.length.toString();
    msg.embeds[0].fields[1].value = sug.votes.down.length.toString();

    msg?.edit({
        embeds: msg.embeds
    })
}
