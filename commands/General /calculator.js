const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const math = require('mathjs');

module.exports = {
    data: {
        name: "calculator",
        description: "Use the calculator on discord",
        options: [],
    },
    timeout: 20000,

    run: async (client, interaction) => {
        const rows = [
            new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId('clear')
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("AC"),
                new ButtonBuilder()
                    .setCustomId('(')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("("),
                new ButtonBuilder()
                    .setCustomId(')')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(")"),
                new ButtonBuilder()
                    .setCustomId('/')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("➗")
            ]),
            new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId('7')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("7"),
                new ButtonBuilder()
                    .setCustomId('8')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("8"),
                new ButtonBuilder()
                    .setCustomId('9')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("9"),
                new ButtonBuilder()
                    .setCustomId('*')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("✖️")
            ]),
            new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId('4')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("4"),
                new ButtonBuilder()
                    .setCustomId('5')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("5"),
                new ButtonBuilder()
                    .setCustomId('6')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("6"),
                new ButtonBuilder()
                    .setCustomId('-')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("➖")
            ]),
            new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId('1')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("1"),
                new ButtonBuilder()
                    .setCustomId('2')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("2"),
                new ButtonBuilder()
                    .setCustomId('3')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("3"),
                new ButtonBuilder()
                    .setCustomId('+')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("➕")
            ]),
            new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId('backspace')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("⬅️"),
                new ButtonBuilder()
                    .setCustomId('0')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("0"),
                new ButtonBuilder()
                    .setCustomId('.')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("⚫"),
                new ButtonBuilder()
                    .setCustomId('result')
                    .setStyle(ButtonStyle.Success)
                    .setLabel("=")
            ]),
        ];

        const msg = await interaction.reply({
            components: rows,
            embeds: [{
                description: "```\nResults will be displayed here\n```",
                color: 0x0000FF
            }],
            fetchReply: true,
        });

        let data = "";

        const col = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 600000
        });

        col.on('collect', async (i) => {
            let extra = "";

            if (i.customId === "result") {
                try {
                    data = math.evaluate(data).toString();
                } catch (e) {
                    data = "";
                    extra = "An Error Occured, Please click on AC for restart";
                }
            } else if (i.customId === "clear") {
                data = "";
                extra = "Results will be displayed here"
            } else if (i.customId === "backspace") {
                data = data.slice(0, data.length - 2);
            } else {
                const lc = data[data.length - 1];

                data += `${(
                    (parseInt(i.customId) == i.customId || i.customId === ".")
                    &&
                    (lc == parseInt(lc) || lc === ".")
                ) || data.length === 0 ? "" : " "}` + i.customId;
            }

            i.update({
                embeds: [{
                    color: 0x0000FF,
                    description: `\`\`\`\n${data || extra}\n\`\`\``
                }]
            })
        })

        col.on('end', () => {
            msg.edit({
                components: [new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setLabel("The Calculator Ended")
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("_1_")
                ])]
            })
        })
    }
}
