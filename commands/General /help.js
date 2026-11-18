const { ActionRowBuilder, EmbedBuilder, MessageFlags, StringSelectMenuBuilder } = require('discord.js');
const commandInfo = require('../../utility/commandInfo');
const { error } = require('../../utils/response');

// Static choices: Discord requires these to be known when the command is registered.
const CATEGORY_CHOICES = ['Admin', 'Fun', 'General', 'Giveaway', 'Level', 'Moderation', 'Owner', 'Welcome']
    .map(v => ({ name: v, value: v.toLowerCase() }));

// Command names are suggested via autocomplete (see events/interactionCreate.js) because
// Discord caps static choices at 25 and the bot has more commands than that.

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

module.exports = {
    data: {
        name: "help",
        description: "Get some help ;D",
        options: [{
            name: "basic",
            description: "Get an overview of the bot and browse categories",
            type: 1
        }, {
            name: "commands",
            description: "Get information of all commands of a category",
            type: 1,
            options: [{
                name: "category",
                type: 3,
                required: true,
                description: "The category who's commands information you want",
                choices: CATEGORY_CHOICES
            }]
        }, {
            name: "command",
            description: "Get information of a command",
            type: 1,
            options: [{
                name: "command",
                type: 3,
                required: true,
                description: "The command who's commands information you want",
                autocomplete: true
            }]
        }]
    },

    /**
     *
     * @param {*} client
     * @param {import('discord.js').CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const option = interaction.options.getSubcommand();

        if (option === "basic") {
            return showOverview(client, interaction);
        }

        if (option === "commands") {
            const category = interaction.options.getString("category").toLowerCase();
            const commands = client.commands.filter(v => v.category.trim().toLowerCase() === category);

            return interaction.reply({
                embeds: [categoryEmbed(category, commands)],
                flags: MessageFlags.Ephemeral
            });
        }

        if (option === "command") {
            const command = client.commands.get(interaction.options.getString("command").toLowerCase());
            if (!command) {
                return interaction.reply({
                    embeds: [error("I couldn't find that command.", 'Use `/help basic` to browse the available commands.')],
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.reply({
                embeds: [commandInfo(command)],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

async function showOverview(client, interaction) {
    const categories = [...new Set(client.commands.map(c => c.category.trim().toLowerCase()))].sort();

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_category")
            .setPlaceholder("Choose a category")
            .addOptions(categories.map(category => ({
                label: capitalize(category),
                value: category
            })))
    );

    const message = await interaction.reply({
        fetchReply: true,
        flags: MessageFlags.Ephemeral,
        components: [row],
        embeds: [overviewEmbed(client, categories)]
    });

    // Collector-driven: the router never needs to handle `help_category`.
    const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId === 'help_category',
        time: 300000
    });

    collector.on('collect', async (i) => {
        try {
            const category = i.values[0];
            const commands = client.commands.filter(v => v.category.trim().toLowerCase() === category);
            await i.update({ embeds: [categoryEmbed(category, commands)], components: [row] });
        } catch (e) {
            console.log(e);
        }
    });

    collector.on('end', () => {
        message.edit({ components: [] }).catch(() => { });
    });
}

function overviewEmbed(client, categories) {
    const listing = categories.map(category => {
        const names = client.commands
            .filter(v => v.category.trim().toLowerCase() === category)
            .map(v => `\`${v.data.name}\``)
            .join(', ');
        return `**${capitalize(category)}**\n${names}`;
    }).join('\n\n');

    return new EmbedBuilder()
        .setTitle(`${client.user.username}'s Help 📚`)
        .setDescription(`Browse all commands by category.\n\n${listing}`)
        .setColor(0x1565C0);
}

function categoryEmbed(category, commands) {
    const listing = commands
        .map((command, index) => `\`${index + 1}.\` **${command.data.name}** — ${command.data.description || "No description"}`)
        .join('\n');

    return new EmbedBuilder()
        .setTitle(`${capitalize(category)} commands 📑`)
        .setDescription(listing || 'No commands in this category.')
        .setColor(0x1565C0);
}
