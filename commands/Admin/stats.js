const { ChannelType, SlashCommandBuilder } = require('discord.js');
const stats = require('../../models/guildStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Configure the stats for your server (Requires Manage Server)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('What kind of stats you want to setup')
                .setRequired(true)
                .addChoices(
                    { name: 'members-stats', value: 'members' },
                    { name: 'server-stats', value: 'server' }
                ))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The voice channel in which you wanna show the stats')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel') || await interaction.guild.channels.create(`Members : ${interaction.guild.memberCount}`, {
            reason: 'for stats',
            type: ChannelType.GuildVoice
        });

        const newData = { guild: interaction.guildId };
        newData[interaction.options.getString('type')] = channel.id;

        const data = await stats.findOneAndUpdate({ guild: interaction.guildId }, newData, { new: true }) || await stats.create(newData);

        await interaction.editReply({ content: `Added stats for ${interaction.options.getString('type')}` });
    },
};
