const { MessageFlags } = require('discord.js');
const reactionRoles = require('../interactions/reactionRoles');
const tickets = require('../interactions/tickets');
const suggestions = require('../interactions/suggestions');
const polls = require('../interactions/polls');
const menus = require('../interactions/menus');
const reactionRoleModel = require('../models/reactionRole');
const ticketPanels = require('../models/tickets');

module.exports = async (client, interaction) => {
  if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
    try {
      await client.commands.get(interaction.commandName)?.run(client, interaction);
    } catch (e) {
      console.log(e);
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: "SOMETHING WENT WRONG " });
      } else {
        interaction.reply({ content: "SOMETHING WENT WRONG " });
      }
    }
    return;
  }

  if (interaction.isAutocomplete()) {
    try {
      const focused = interaction.options.getFocused(true);
      const query = (focused?.value ?? '').toString().toLowerCase();
      let names = [];

      if (interaction.commandName === 'menu' && focused?.name === 'name') {
        const docs = await reactionRoleModel.find({ guild: interaction.guildId }).select('name').lean();
        names = docs.map(d => d.name).filter(Boolean);
      } else if (interaction.commandName === 'ticket' && focused?.name === 'panel-name') {
        const docs = await ticketPanels.find({ guild: interaction.guildId }).select('name').lean();
        names = docs.map(d => d.name).filter(Boolean);
      } else if (interaction.commandName === 'help' && focused?.name === 'command') {
        names = [...client.commands.keys()].sort();
      }

      const choices = names
        .filter(name => name.toLowerCase().includes(query))
        .slice(0, 25)
        .map(name => ({ name: name.slice(0, 100), value: name }));

      return await interaction.respond(choices);
    } catch (e) {
      console.log(e);
      try { return await interaction.respond([]); } catch (_) { /* already acknowledged */ }
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('menu_emoji_modal')) {
      try {
        return await menus.handleEmojiModal(client, interaction);
      } catch (e) {
        console.log(e);
        if (!interaction.replied && !interaction.deferred) {
          try { return await interaction.reply({ content: "SOMETHING WENT WRONG ", flags: MessageFlags.Ephemeral }); } catch (_) { /* ignore */ }
        }
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith('reaction_role_')) return reactionRoles(client, interaction);
    if (customId === 'ticket_create') return tickets(client, interaction);
    if (customId === 'suggest_up' || customId === 'suggest_down') return suggestions(client, interaction);
    if (customId.startsWith('poll_')) return polls(client, interaction);

    // Calculator (calc/collector-driven) and other buttons are handled by their own collectors.
    return;
  }

  // Select menus and other component interactions are handled by their own collectors.
};
