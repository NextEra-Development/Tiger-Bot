const { ActivityType, Client } = require("discord.js");

module.exports = {
    data: {
        name: "owner",
        description: "Change the status of Tiger Bot!",
        options: [{
            name: "status",
            description: "the new status of Tiger Bot!",
            required: true,
            type: 3, // Corrected type to STRING (3)
        }],
    },

    /**
     * 
     * @param {Client} client 
     * @param {*} interaction 
     * @returns 
     */
    run: async (client, interaction,args) => {
        if (!client.owners.includes(interaction.user.id)) return interaction.reply({ content: `You are not a owner` });

        client.user.setActivity({
            name: interaction.options.getString("status", true),
            type: ActivityType.Playing
        });

        interaction.reply({ content: `Status changed to  : ${interaction.options.getString("status")}` });
    }
}
