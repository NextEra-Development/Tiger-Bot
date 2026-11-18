const fight = require('discord-fight-game');

module.exports = {
    data: {
        name: "fight",
        description: "Fight someone",
        options: [{
            name: "user",
            description: "Mention a user",
            required: false,
            type: 6, // Corrected type to USER (6)
        }],
    },

    run: async (client, interaction) => {
        const game = new fight(client, {
            oneEmoji: "<a:pepeenchantednetheritesword:981915318597349436>",
            oneName: "Sword",
            twoEmoji: "<a:Bow:981915918600925214> ",
            twoName: "Bow",
            threeEmoji: "<a:Cap_Shield:981920983701143572> ",
            threeName: "Shield",
            endEmoji: "<a:RunRunRun:981922722705711174> ",
            endName: "run away",

            // Custom Messages
            startMessage: "The war has begun, get ready warriors",
            midMessage: "The fighters chose their move, Current battle condition :",
            endMessage: "{winner} gloriously defeated {looser}",
            forceEndMessage: "{user} was scared so they ended the war",
            timeEndMessage: "{user} ran away from the war",

            // Custom Game LOgic
            startHealth: 69,
        });

        interaction.reply({ content: `The game is started` });

        const user = interaction.options.getUser("user");

        interaction.author = interaction.user;

        if (user && user.bot) return interaction.editReply({ content: "You can not play the game with bots" })

        if (!user) game.solo(interaction)
        else game.duo(interaction, user);
    }
}
