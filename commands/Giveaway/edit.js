const { MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
  data: {
    name: 'edit',
    description: '🎉 Edit a giveaway',

    options: [
        {
            name: 'giveaway',
            description: 'The giveaway to end (message ID)',
            type: 3, // Corrected type to STRING (3)
            required: true
        },
        {
            name: 'duration',
            description: 'Setting time of mentioned giveaway. Eg. 1h sets the current giveaway to end after an hour!',
            type: 3, // Corrected type to STRING (3)
            required: true
        },
        {
            name: 'winners',
            description: 'How many winners the giveaway should have',
            type: 4, // Corrected type to INTEGER (4)
            required: true
        },
        {
            name: 'prize',
            description: 'What the prize of the giveaway should be',
            type: 3, // Corrected type to STRING (3)
            required: true
        }
    ]},

    run: async (client, interaction) => {

        // If the member doesn't have enough permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && !interaction.member.roles.cache.some((r) => r.name === "Giveaways")) {
            return interaction.reply({
                content: ':x: You need to have the manage messages permissions to start giveaways.',
                flags: MessageFlags.Ephemeral
            });
        }
        const gid = interaction.options.getString('giveaway');
        const time = interaction.options.getString('duration');
        const winnersCount = interaction.options.getInteger('winners');
        const prize = interaction.options.getString('prize');
        
        await interaction.deferReply({
         flags: MessageFlags.Ephemeral
        })
        // Edit the giveaway
        try {
        await client.giveawaysManager.edit(gid, {
            newWinnersCount: winnersCount,
            newPrize: prize,
            addTime: time
        })
        } catch(e) {
return interaction.editReply({
            content:
                `No giveaway found with the given message ID: \`${gid}\``,
            flags: MessageFlags.Ephemeral
        });
        }
        interaction.editReply({
            content:
                `This giveaway has now been edited!`,
            flags: MessageFlags.Ephemeral
        });
    }

};
