module.exports = {
    data: {
        name: "ping",
        description: "Get Tiger bot's ping!",
        options: [],
    },
    timeout:10000,

    run: async (client, interaction) => {
        interaction.reply({ content: `The ping of the Tiger Bot is ${client.ws.ping} <a:ping69:981912993614942259> ` })
    }
  }