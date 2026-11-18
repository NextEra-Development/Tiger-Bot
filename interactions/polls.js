const { MessageFlags } = require("discord.js");
const polls = require("../models/polls");

module.exports = async (client, interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith('poll_')) return;

    const pol = await polls.findOne({ message: interaction.message.id });

    if (!pol) return;

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    if (pol.voters.includes(interaction.user.id)) return interaction.editReply({
        embeds: [{
            color: 0xFF0000,
            title: "❌ Already Voted!"
        }]
    });

    const emoji = interaction.customId.slice(5);

    pol.votes = pol.votes || {};

    if (pol.votes[emoji]) pol.votes[emoji] += 1
    else pol.votes[emoji] = 1;

    pol.voters.push(interaction.user.id);

    await polls.findOneAndUpdate({ message: pol.message }, pol);

    interaction.editReply({
        embeds: [{
            color: 0x00FF00,
            title: "✅ Voted Successfully"
        }]
    });

    const m = interaction.message;

    m.edit({
        components: m.components.map(row => {
            row.components = row.components?.map(v => {
                v.data.label = `${pol.votes[v.customId.slice(5)] || 0}`;

                return v;
            });

            return row;
        })
    })
}
