const { ChannelType, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const guildConfig = require('../../models/guildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokemon')
        .setDescription('Setup the pokemon game for your server (Requires Manage Server)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable-spawn')
                .setDescription('Enable the slash commands'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable-spawn')
                .setDescription('Disable the slash commands'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('spawn-after')
                .setDescription('Random pokemon spawning points')
                .addIntegerOption(option =>
                    option
                        .setName('number')
                        .setDescription('Number of points')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('spawn-channel')
                .setDescription('Set the random pokemon spawn\'s channel')
                .addStringOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Mention or give ID, 0 for same channel spawn')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
    permissions: ["MANAGE_GUILD"],

    async execute(interaction) {
        await interaction.deferReply();
        const data = await guildConfig.findOne({ id: interaction.guildId }) || await guildConfig.create({ id: interaction.guildId });
        const command = interaction.options.getSubcommand();

        switch (command) {
            case "enable-spawn":
                await this.enableSpawn(interaction, data);
                break;
            case "disable-spawn":
                await this.disableSpawn(interaction, data);
                break;
            case "spawn-after":
                await this.spawnAfter(interaction);
                break;
            case "spawn-channel":
                await this.spawnChannel(interaction);
                break;
        }
    },

    async enableSpawn(interaction, data) {
        if (data.pokemon.spawn) {
            return interaction.editReply({ content: `The pokemon spawning is already enabled` });
        }

        await guildConfig.findOneAndUpdate({ id: interaction.guildId }, { "pokemon.spawn": true });
        interaction.editReply({ content: "Enabled pokemon spawning" });
    },

    async disableSpawn(interaction, data) {
        if (!data.pokemon.spawn) {
            return interaction.editReply({ content: `The pokemon spawning is already disabled` });
        }

        await guildConfig.findOneAndUpdate({ id: interaction.guildId }, { "pokemon.spawn": false });
        interaction.editReply({ content: "Disabled pokemon spawning" });
    },

    async spawnAfter(interaction) {
        const points = interaction.options.getInteger("number");

        if (points < 10) {
            return interaction.editReply({ content: "The points can't be below 10" });
        }

        await guildConfig.findOneAndUpdate({ id: interaction.guildId }, { "pokemon.afterPoints": points });
        interaction.editReply({ content: `Pokemon spawning required points are now set to ${points}` });
    },

    async spawnChannel(interaction) {
        const raw = interaction.options.getString("channel");
        const channel = getChannel(raw, interaction);

        if (!isValidChannel(channel)) {
            return interaction.editReply("Invalid channel was provided, either type 0 for same channel, or mention / give id of a text channel");
        }

        await guildConfig.findOneAndUpdate({ id: interaction.guildId }, { "pokemon.spawnAt": channel === "0" ? "0" : channel.id });
        interaction.editReply({ content: `${channel === "0" ? "Set the pokemon spawning to the same channel where the latest message was sent" : `Now pokemons will spawn in <#${channel.id}>`}` });
    }
};

// Helper functions
function isValidChannel(channel) {
    return channel && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews);
}

function getChannel(raw, interaction) {
    return raw === "0" ? raw : interaction.guild.channels.cache.get(raw) || interaction.guild.channels.cache.get(raw.substring(2, raw.length - 1));
}
