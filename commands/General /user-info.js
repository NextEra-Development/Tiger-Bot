const { EmbedBuilder } = require('discord.js');

const ts = (date) => `<t:${Math.floor(date.getTime() / 1000)}:D> (<t:${Math.floor(date.getTime() / 1000)}:R>)`;

module.exports = {
    data: {
        name: 'user-info',
        description: 'Show information about a user',
        options: [{
            name: 'user', type: 6, required: false, description: 'The user to look up (defaults to you)'
        }]
    },

    run: async (client, interaction) => {
        await interaction.deferReply();
        const picked = interaction.options.getUser('user') || interaction.user;
        // Force-fetch so the profile banner is available.
        const user = await picked.fetch(true).catch(() => picked);
        const member = interaction.inGuild() ? (interaction.options.getMember('user') || (user.id === interaction.user.id ? interaction.member : null)) : null;

        const embed = new EmbedBuilder()
            .setColor(member?.displayColor || 0x1565C0)
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'User', value: `${user} (\`${user.id}\`)`, inline: false },
                { name: 'Account created', value: ts(user.createdAt), inline: false }
            )
            .setTimestamp();

        if (user.bot) embed.setFooter({ text: 'This user is a bot' });

        if (member?.joinedAt) {
            const roles = member.roles.cache
                .filter(r => r.id !== interaction.guildId)
                .sort((a, b) => b.position - a.position)
                .map(r => r.toString());
            const shown = roles.slice(0, 20).join(' ') + (roles.length > 20 ? ` +${roles.length - 20} more` : '');

            embed.addFields(
                { name: 'Joined server', value: ts(member.joinedAt), inline: false },
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Highest role', value: member.roles.highest.id === interaction.guildId ? 'None' : member.roles.highest.toString(), inline: true },
                { name: `Roles (${roles.length})`, value: shown || 'None', inline: false }
            );
            if (member.isCommunicationDisabled()) {
                embed.addFields({ name: 'Timed out until', value: ts(member.communicationDisabledUntil), inline: false });
            }
        } else if (interaction.inGuild()) {
            embed.addFields({ name: 'Server', value: 'Not a member of this server', inline: false });
        }

        if (user.banner) embed.setImage(user.bannerURL({ size: 1024 }));

        return interaction.editReply({ embeds: [embed] });
    }
};
