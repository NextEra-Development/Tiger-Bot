const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const menus = require('../../models/reactionRole');
const menuInteractions = require('../../interactions/menus');
const { success, error, warn } = require('../../utils/response');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('menu')
        .setDescription('Manage guild reaction role (Requires Manage Server)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new role menu')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the role menu')
                        .setAutocomplete(true)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a role menu')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the role menu')
                        .setAutocomplete(true)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new role menu')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the role menu')
                        .setAutocomplete(true)
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Mention the channel')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-role')
                .setDescription('Add a role in a reaction role menu')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the role menu')
                        .setAutocomplete(true)
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Mention the role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-role')
                .setDescription('Remove a role from a reaction role menu')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the role menu')
                        .setAutocomplete(true)
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Mention the role')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild | PermissionsBitField.Flags.ManageRoles),
    permissions: ["MANAGE_GUILD", "MANAGE_ROLES"],

    async execute(interaction) {
        const option = interaction.options.getSubcommand(true).toLowerCase();
        const name = interaction.options.getString("name")?.toLowerCase()?.trim();
        const role = interaction.options.getRole("role");

        // The emoji is collected through a modal, which must be the first response.
        if (option === 'add-role') {
            const myRole = interaction.guild.members.me.roles.highest.position;
            if (role.position >= myRole) {
                return interaction.reply({
                    embeds: [error('The provided role is above my highest role.', 'Adjust the role hierarchy and try again.')],
                    flags: MessageFlags.Ephemeral
                });
            }

            menuInteractions.setPending(interaction.user.id, { name, roleId: role.id });
            return interaction.showModal(menuInteractions.buildEmojiModal(role.id));
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const menu = await menus.findOne({ name, guild: interaction.guildId });
        const channel = interaction.options.getChannel("channel");

        switch (option) {
            case "create":
                return handleCreate(interaction, menu, name);
            case "delete":
                return handleDelete(interaction, menu, name);
            case "start":
                return handleStart(interaction, menu, channel);
            case "remove-role":
                return handleRemoveRole(interaction, menu, role, name);
            default:
                return interaction.editReply({ embeds: [error('Invalid subcommand.')] });
        }
    }
};

async function handleCreate(interaction, menu, name) {
    if (menu) {
        return interaction.editReply({
            embeds: [error('A reaction role menu with that name already exists.', 'Choose a different name or delete the existing menu.')]
        });
    }

    await menus.create({ guild: interaction.guildId, name, roles: [], message: "0" });
    return interaction.editReply({
        embeds: [success(`Role menu created with name: \`${name}\`.`, 'Use `/menu add-role` to add roles to it.')]
    });
}

async function handleDelete(interaction, menu, name) {
    if (!menu) {
        return interaction.editReply({
            embeds: [error('No reaction role menu exists with that name.', 'Use `/menu create` to make one.')]
        });
    }

    await menus.findOneAndDelete({ guild: interaction.guildId, name });
    return interaction.editReply({
        embeds: [success(`Role menu deleted with name: \`${name}\`.`)]
    });
}

async function handleStart(interaction, menu, channel) {
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildNews) {
        return interaction.editReply({
            embeds: [error('Invalid channel was provided.', 'Pick a text or news channel.')]
        });
    }
    if (!menu?.roles?.length) {
        return interaction.editReply({
            embeds: [warn('This menu has 0 roles.', 'Add at least one role with `/menu add-role` before starting it.')]
        });
    }

    const { content, rows } = createMenuContentAndButtons(interaction, menu);

    // Public panel send — must stay public.
    const msg = await channel.send({ content, components: rows });

    await menus.findOneAndUpdate({ name: menu.name, guild: interaction.guildId }, { message: msg.id });
    return interaction.editReply({
        embeds: [success('Menu started successfully.')]
    });
}

function createMenuContentAndButtons(interaction, menu) {
    let content = `Reaction Menu : **${menu.name}**\n\nReact to get yourself a role\n\n`,
        rows = [new ActionRowBuilder()], index;

    menu.roles.forEach((v, i) => {
        content += `> ${interaction.guild.emojis.cache.get(v.emoji)?.toString() || v.emoji} : \`${interaction.guild.roles.cache.get(v.role).name}\`\n\n`;

        index = parseInt(i / 5);
        const button = new ButtonBuilder()
            .setCustomId(`reaction_role_${i}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(v.emoji);

        rows[index] ? rows[index].addComponents(button) : rows[index] = new ActionRowBuilder().addComponents(button);
    });

    return { content, rows };
}

async function handleRemoveRole(interaction, menu, role, name) {
    if (!menu) {
        return interaction.editReply({
            embeds: [error('Reaction role menu does not exist with that name.', 'Use `/menu create` to make one.')]
        });
    }

    if (!isRoleInMenu(menu, role)) {
        return interaction.editReply({
            embeds: [error('Reaction role menu does not have this role as part of it.')]
        });
    }

    menu.roles = menu.roles.filter((v) => v.role !== role.id);
    await menus.findOneAndUpdate({ name, guild: interaction.guildId }, { roles: menu.roles });

    return interaction.editReply({
        embeds: [success(`Removed role \`${role.name}\` from menu \`${menu.name}\``)]
    });
}

function isRoleInMenu(menu, role) {
    return menu.roles.some(v => v.role === role.id);
}
