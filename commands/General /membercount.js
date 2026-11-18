const { EmbedBuilder, MessageFlags } = require('discord.js');
const { error } = require('../../utils/response');

module.exports = {
    data: {
        name: 'membercount',
        description: 'Show how many members this server has',
        options: []
    },

    run: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
        }

        const guild = interaction.guild;
        await interaction.deferReply();

        // The member cache only holds members the bot has seen. Fill it for small/medium servers so
        // the human/bot split is accurate; for large ones, show just the total.
        if (guild.members.cache.size < guild.memberCount && guild.memberCount <= 10000) {
            await guild.members.fetch({ time: 10000 }).catch(() => null);
        }
        const members = guild.members.cache;
        const bots = members.filter(m => m.user.bot).size;
        const cachedAll = members.size >= guild.memberCount;

        const embed = new EmbedBuilder()
            .setColor(0x1565C0)
            .setTitle(`${guild.name} members`)
            .setThumbnail(guild.iconURL({ size: 128 }))
            .addFields({ name: 'Total', value: guild.memberCount.toLocaleString(), inline: true });

        if (cachedAll) {
            embed.addFields(
                { name: 'Humans', value: (members.size - bots).toLocaleString(), inline: true },
                { name: 'Bots', value: bots.toLocaleString(), inline: true }
            );
        }

        return interaction.editReply({ embeds: [embed] });
    }
};
