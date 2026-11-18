const { EmbedBuilder, MessageFlags } = require('discord.js');
const polls = require('../../models/polls');
const { error } = require('../../utils/response');

const bar = (share) => '█'.repeat(Math.round(share * 10)).padEnd(10, '░');

module.exports = {
    data: {
        name: 'poll-show',
        description: 'Show the current results of a poll',
        options: [{
            name: 'id', type: 3, required: true, max_length: 25, description: 'Message ID of the poll'
        }]
    },

    run: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ embeds: [error('This command only works in a server.')], flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reply = (payload) => interaction.editReply(payload);

        const id = interaction.options.getString('id').trim();
        const poll = await polls.findOne({ message: id, guild: interaction.guildId }).lean();
        if (!poll) return reply({ embeds: [error("I couldn't find a poll with that message ID in this server.", 'Right-click the poll message → Copy Message ID.')] });

        const votes = poll.votes || {};
        const total = Object.values(votes).reduce((sum, n) => sum + n, 0);

        // Option labels live in the poll message itself. `/poll end` overwrites that text, so only
        // trust it while the poll is open and the line count still matches; otherwise show emojis.
        const message = await interaction.guild.channels.cache.get(poll.channel)?.messages.fetch(id).catch(() => null);
        const lines0 = message?.embeds[0]?.description?.split('\n') || [];
        const labels = !poll.ended && lines0.length === (poll.emojis || []).length ? lines0 : [];

        const lines = (poll.emojis || []).map((emoji, i) => {
            const count = votes[emoji] || 0;
            const share = total ? count / total : 0;
            const label = labels[i] || (/^\d+$/.test(emoji) ? `<:e:${emoji}>` : emoji);
            return `${label}\n\`${bar(share)}\` **${count}** vote(s) • ${Math.round(share * 100)}%`;
        });

        const embed = new EmbedBuilder()
            .setColor(poll.ended ? 0xC62828 : 0x1565C0)
            .setTitle((poll.question || 'Poll').slice(0, 256))
            .setDescription(lines.join('\n\n').slice(0, 4000) || 'No options recorded.')
            .setFooter({ text: `${poll.ended ? 'Ended' : 'Open'} • ${total} vote(s)` });
        if (message) embed.setURL(message.url);

        return reply({ embeds: [embed] });
    }
};
