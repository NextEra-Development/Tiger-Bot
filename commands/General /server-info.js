const { ChannelType, EmbedBuilder, GuildVerificationLevel, MessageFlags } = require('discord.js');
const { error } = require('../../utils/response');

const VERIFICATION = {
    [GuildVerificationLevel.None]: 'None',
    [GuildVerificationLevel.Low]: 'Low',
    [GuildVerificationLevel.Medium]: 'Medium',
    [GuildVerificationLevel.High]: 'High',
    [GuildVerificationLevel.VeryHigh]: 'Highest'
};

const ts = (date) => `<t:${Math.floor(date.getTime() / 1000)}:D> (<t:${Math.floor(date.getTime() / 1000)}:R>)`;

module.exports = {
    data: {
        name: 'server-info',
        description: 'Show information about this server',
        options: []
    },

    run: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();
        const guild = interaction.guild;
        const owner = await guild.fetchOwner().catch(() => null);
        const channels = guild.channels.cache;
        const count = (...types) => channels.filter(c => types.includes(c.type)).size;

        const embed = new EmbedBuilder()
            .setColor(0x1565C0)
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: 'Owner', value: owner ? `${owner.user} (\`${owner.id}\`)` : `<@${guild.ownerId}>`, inline: true },
                { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
                { name: 'Created', value: ts(guild.createdAt), inline: false },
                { name: 'Members', value: guild.memberCount.toLocaleString(), inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size - 1}`, inline: true },
                { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                {
                    name: 'Channels',
                    value: `💬 ${count(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)} text • 🔊 ${count(ChannelType.GuildVoice, ChannelType.GuildStageVoice)} voice • 📁 ${count(ChannelType.GuildCategory)} categories`,
                    inline: false
                },
                { name: 'Boosts', value: `Level ${guild.premiumTier} • ${guild.premiumSubscriptionCount || 0} boosts`, inline: true },
                { name: 'Verification', value: VERIFICATION[guild.verificationLevel] || 'Unknown', inline: true }
            )
            .setTimestamp();

        if (guild.description) embed.setDescription(guild.description);
        if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

        return interaction.editReply({ embeds: [embed] });
    }
};
