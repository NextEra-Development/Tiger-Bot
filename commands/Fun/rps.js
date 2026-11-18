const rps = require('discord-rock-paper-scissor');
const game = new rps({ choiceReply: "You chose {move}", 
                     endTitle: "Game ended very very victoriously for {winner}", 
                     readyMessage: "Choose the dang moves kiddos", 
                     drawEndTitle: "Bruh nerds ended up getting a draw", 
choiceTitle: "Choose the move boiiiiiiiiiiiiiiiii", 
                     choiceDescription: "I hope that you can read than click on buttons to choose the move", 
                     drawEndDescription: "{player1} chose : {player1move}\n\n{player2} chose : {player2move}\nStupid nerds arent they", 
                     endDescription: "[Winner 👑] {winner}'s move : {winnermove}\n\n[Looser 🤮] {looser}'s move : {loosermove}", 
                     chooseIn: "channel", 
                     
                     colors: { 
                       drawEmbed: "#0505e7", 
                       endEmbed: "#1ae705", 
                       errorEmbed: "#e70580", 
readyEmbed: "#05b0e7" } });

module.exports = {
    data: {
        name: "rock-paper-scissor",
        description: "Play rock paper scissor game",
        options: [{
            name: "user",
            description: "Mention a user",
            required: false,
            type: 6, // Corrected type to USER (6)
        }],
    },

    run: async (client, interaction) => {
        interaction.reply({ content: `The game is started` });
        const user = interaction.options.getUser("user");

        if (user && user.bot) return interaction.editReply({ content: "You can not play the game with bots" })

        if (!user) game.solo(interaction, client)
        else game.duo(interaction, user);
    }
}
