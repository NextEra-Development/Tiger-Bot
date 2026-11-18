const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async (interaction, pages, time = 60000) => {
    if (!interaction || !pages || !(pages?.length > 0) || !(time > 10000)) throw new Error("Invalid parameters");

    let index = 0, row = new ActionRowBuilder().addComponents([new ButtonBuilder()
        .setCustomId("page_prev")
        .setEmoji("◀")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true), new ButtonBuilder()
        .setCustomId("page_next")
        .setEmoji("▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages.length < 2), new ButtonBuilder()
        .setCustomId("page_close")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)]);

    let data = {
        embeds: [pages[index]],
        components: [row],
        fetchReply: true
    };

    const msg = interaction.replied ? await interaction.followUp(data) : await interaction.reply(data);

    const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time
    });

    col.on('collect', (i) => {
        if (i.customId === "page_prev") index--;
        else if (i.customId === "page_next") index++;
        else return col.stop();

        row.setComponents([new ButtonBuilder()
            .setCustomId("page_prev")
            .setEmoji("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === 0), new ButtonBuilder()
            .setCustomId("page_next")
            .setEmoji("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === pages.length - 1), new ButtonBuilder()
            .setCustomId("page_close")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)]);

        i.update({
            components: [row],
            embeds: [pages[index]]
        })
    });

    col.on('end', () => {
        msg.edit({
            components: []
        })
    })
}
