const users = require('../../models/user_xp');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: "rank",
        description: "Check your lvl",
        options: [{
            name: "user",
            description: "Mention a user",
            required: false,
            type: 6,
        }],
    },

    run: async (client, interaction) => {

        const user = interaction.options.getUser("user") || interaction.user;
        let datas = await users.find({ guild: interaction.guild.id }) || {}, data, rank;

        for (let i = 0; i < datas.length; i++) {
            let v = datas[i];

            if (v.user === user.id) {
                data = v;
                rank = i + 1;
                break;
            }
        };

        if (!data) return interaction.reply("LOL you have no xp & data")

        let reqXP = 100;

        for (let i = 1; i <= data.level; i++)reqXP += 5 * (i ^ 2) + (50 * i) + 100;
      const embed = new EmbedBuilder()
     .setTitle('USERS DATA ')
     .setDescription(`USER LEVEL = ${data.level}\n\nUSER XP = ${data.xp}/${reqXP}`) 
    .setThumbnail(`${interaction.user.displayAvatarURL({ dynamic: true })}`)
      .setColor('#2f3136')
      .setTimestamp()
 interaction.reply({ embeds: [embed] })
    }
}