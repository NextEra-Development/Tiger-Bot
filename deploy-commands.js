const fs = require('fs');
const path = require('path');
const { PermissionsBitField, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const { CLIENT_ID, GUILD_ID } = process.env;

// Module-level permission metadata lives on the command object, not in its plain-object
// `data`, so it has to be merged into the payload before the bulk PUT.
function serializeCommand(command) {
    const data = command.data instanceof SlashCommandBuilder || typeof command.data.toJSON === 'function'
        ? command.data.toJSON()
        : command.data;

    // Builders already serialize their own setDefaultMemberPermissions; only fill gaps.
    if (command.default_member_permissions != null && data.default_member_permissions == null) {
        const value = command.default_member_permissions;
        data.default_member_permissions = typeof value === 'string' && /^\d+$/.test(value)
            ? value
            : PermissionsBitField.resolve(value).toString();
    }

    return data;
}

const commands = [];
const commandsDir = path.join(__dirname, './commands');

for (const category of fs.readdirSync(commandsDir)) {
    const categoryDir = path.join(commandsDir, category);
    if (!fs.statSync(categoryDir).isDirectory()) continue;

    for (const file of fs.readdirSync(categoryDir)) {
        if (!file.endsWith('.js')) continue;

        const command = require(path.join(categoryDir, file));
        if (command && typeof command.run !== 'function' && typeof command.execute === 'function') {
            // execute(interaction) takes a single argument; run is invoked as run(client, interaction).
            command.run = (c, i) => command.execute(i);
        }
        if (!command || !command?.data?.name || typeof command.run !== 'function') continue;

        commands.push(serializeCommand(command));
    }
}

// Owner-only commands live outside ./commands; load them the same way as category commands.
const ownerDir = path.join(__dirname, './Owner');
if (fs.existsSync(ownerDir)) {
    for (const file of fs.readdirSync(ownerDir)) {
        if (!file.endsWith('.js')) continue;

        const command = require(path.join(ownerDir, file));
        if (command && typeof command.run !== 'function' && typeof command.execute === 'function') {
            command.run = (c, i) => command.execute(i);
        }
        if (!command || !command?.data?.name || typeof command.run !== 'function') continue;

        commands.push(serializeCommand(command));
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const route = GUILD_ID
            ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
            : Routes.applicationCommands(CLIENT_ID);

        const data = await rest.put(route, { body: commands });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
