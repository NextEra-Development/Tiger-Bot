const { MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
  data: {
  name: "reroll",
    description: '🎉 Reroll a giveaway',

    options: [
        {
            name: 'giveaway',
            description: 'The giveaway to reroll (message ID or prize)',
            type: 3,
            required: true
        }
    ]},

    run: async (client, interaction) => {

        // If the member doesn't have enough permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && !interaction.member.roles.cache.some((r) => r.name === "Giveaways")) {
            return interaction.reply({
                content: ':x: You need to have the manage messages permission to reroll giveaways.',
                flags: MessageFlags.Ephemeral
            });
        }

        const query = interaction.options.getString('giveaway');

        // try to find the giveaway with the provided prize OR with the ID
        const giveaway =
            // Search with giveaway prize
            client.giveawaysManager.giveaways.find((g) => g.prize === query && g.guildId === interaction.guild.id) ||
            // Search with giveaway ID
            client.giveawaysManager.giveaways.find((g) => g.messageId === query && g.guildId === interaction.guild.id);

        // If no giveaway was found
        if (!giveaway) {
            return interaction.reply({
                content: 'Unable to find a giveaway for `' + query + '`.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (!giveaway.ended) {
            return interaction.reply({
                content: `[This Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) has not been ended yet`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Reroll the giveaway
        client.giveawaysManager.reroll(giveaway.messageId)
            .then(() => {
                // Success message
                interaction.reply(`Rerolled **[this giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})!**`);
            })
            .catch((e) => {
                interaction.reply({
                    content: `Error: ${e.message}`,
                    flags: MessageFlags.Ephemeral
                });
            });

    }
};