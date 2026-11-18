const { EmbedBuilder, MessageFlags } = require('discord.js');
const users = require('../../models/user_xp');
const { error } = require('../../utils/response');

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    data: {
        name: 'leaderboard',
        description: "Show the server's XP leaderboard",
        options: [{
            name: 'page', type: 4, required: false, min_value: 1, description: 'Page number (10 users per page)'
        }]
    },

    run: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();
        const guild = interaction.guildId;
        const total = await users.countDocuments({ guild, xp: { $gt: 0 } });
        if (!total) {
            return interaction.editReply({ embeds: [error('Nobody has earned XP in this server yet.', 'An admin can turn XP on with `/xp enable`.')] });
        }

        const pages = Math.ceil(total / PAGE_SIZE);
        const page = Math.min(interaction.options.getInteger('page') || 1, pages);
        const rows = await users.find({ guild, xp: { $gt: 0 } })
            .sort({ level: -1, xp: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .lean();

        const lines = rows.map((row, i) => {
            const position = (page - 1) * PAGE_SIZE + i + 1;
            const badge = MEDALS[position - 1] || `\`#${position}\``;
            return `${badge} <@${row.user}> — Level **${row.level}** • ${row.xp.toLocaleString()} XP`;
        });

        // The caller's own position, so they can find themselves on long boards.
        const me = await users.findOne({ guild, user: interaction.user.id }).lean();
        let footer = `Page ${page}/${pages} • ${total} ranked members`;
        if (me?.xp > 0) {
            const ahead = await users.countDocuments({
                guild,
                $or: [{ level: { $gt: me.level } }, { level: me.level, xp: { $gt: me.xp } }]
            });
            footer += ` • You are #${ahead + 1}`;
        }

        const embed = new EmbedBuilder()
            .setColor(0xF9A825)
            .setTitle(`🏆 ${interaction.guild.name} leaderboard`.slice(0, 256))
            .setDescription(lines.join('\n'))
            .setFooter({ text: footer });

        return interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
    }
};
