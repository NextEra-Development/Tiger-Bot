const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: "avatar",
        description: "Check your or users avatar",
        options: [{
            name: "user",
            description: "Mention a user",
            required: false,
            type: 6,
        }],
    },

    run: async (client, interaction) => {

        const user = interaction.options.getUser("user") || interaction.user;
      const AvatarButtons = new ActionRowBuilder()
  .addComponents(
  new ButtonBuilder()
  .setLabel('PNG')
  .setURL(interaction.user.displayAvatarURL({ size: 4096, dynamic: true, format: "png"}))
  .setStyle(ButtonStyle.Link),
  new ButtonBuilder()
  .setLabel('JPG')
  .setURL(interaction.user.displayAvatarURL({ size: 4096, dynamic: true, format: "jpg"}))
  .setStyle(ButtonStyle.Link),
  new ButtonBuilder()
  .setLabel('WEBP')
  .setURL(interaction.user.displayAvatarURL({ size: 4096, dynamic: true, format: "webp"}))
  .setStyle(ButtonStyle.Link)
  );
  

  let embed = new EmbedBuilder()
  .setAuthor({ name: `${user.username}'s Avatar`, url: interaction.user.displayAvatarURL() })

  .addFields([
    { name: 'PNG', value: `\n[\`LINK\`](${user.displayAvatarURL({ size: 4096, dynamic: true, format: "png" })})`, inline: true },
    { name: 'JPG', value: `\n[\`LINK\`](${user.displayAvatarURL({ size: 4096, dynamic: true, format: "jpg" })})`, inline: true },
    { name: 'WEBP', value: `\n[\`LINK\`](${user.displayAvatarURL({ size: 4096, dynamic: true, format: "webp" })})`, inline: true }
  ])

  .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
  .setThumbnail(interaction.guild.iconURL())
  .setColor('Random')
  .setTimestamp()
  interaction.reply({ embeds: [embed], components:[AvatarButtons] })
    }
}
