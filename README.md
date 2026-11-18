# Tiger Bot

Tiger Bot is an advanced multipurpose Discord bot with slash commands. Originally developed in 2022, it has been recently reviewed and updated by NextEra Development. This project holds historical significance as it was the first project of NextEra Development.

## Features

- **Multipurpose Bot**: Supports a variety of commands and functionalities.
- **Slash Commands**: Utilizes Discord's slash commands for ease of use.
- **Giveaways**: Integrated with `discord-giveaways` for managing giveaways.
- **Games**: Includes fun games like fight and rock-paper-scissors.
- **Moderation**: Kick, ban, timeout/mute, warnings with numbered cases, and bulk message clearing.
- **Welcome & goodbye**: Configurable messages with optional generated image banners, plus autoroles.
- **Leveling**: XP, ranks, a server leaderboard, and manual XP adjustments.
- **Customizable**: Easily configurable to suit different server needs.

## Commands

| Category | Commands |
|---|---|
| General | `help`, `ping`, `avatar`, `calculator`, `suggestion`, `server-info`, `user-info`, `role-info`, `membercount` |
| Moderation | `kick`, `ban`, `unban`, `timeout`, `mute`, `unmute`, `warn`, `warnings`, `clear`, `autorole`, `roles` |
| Welcome | `welcome`, `goodbye` |
| Level | `rank`, `xp`, `leaderboard`, `give-xp`, `remove-xp` |
| Admin | `menu`, `poll`, `poll-show`, `stats`, `ticket`, `pokemon` |
| Giveaway | `start`, `edit`, `end`, `pause`, `resume`, `reroll` |
| Fun | `fight`, `pokemons`, `trade`, `rock-paper-scissor` |
| Owner | `owner` |

Moderation commands check that both you and the bot outrank the target. Every kick, ban, unban, timeout, mute, unmute and warn is stored as a numbered case, which you can view with `/warnings list`.

### Welcome banners

`/welcome` and `/goodbye` can attach a generated image banner (avatar, username, member count) to the message. Banners need the optional `@napi-rs/canvas` package, which `npm install` installs from `package.json`. If it is missing, the bot logs a warning and sends text only. Use `/welcome background <url>` for a custom background image, and `/welcome test` to preview.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/Prarambha369/Tiger-Bot.git
    cd Tiger-Bot
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your configuration:
    ```dotenv
    TOKEN=your_discord_bot_token
    MONGO_URI=your_mongodb_uri
    CLIENT_ID=your_discord_client_id
    OWNER_ID=your_discord_owner_id
    ```

4. Start the bot:
    ```sh
    npm run dev
    ```

## Deploying slash commands

Run `npm run deploy-commands` once after changing any command definitions (names, descriptions, options, etc.) to register them with Discord. Set `GUILD_ID` in your `.env` to deploy to a single guild for instant updates; leave it unset to deploy globally. `CLIENT_ID` and `TOKEN` are also required.

## Configuration

The bot uses environment variables for configuration. Ensure you have a `.env` file with the following variables:

- `TOKEN`: Your Discord bot token.
- `MONGO_URI`: Your MongoDB connection string.
- `CLIENT_ID`: Your Discord client ID.
- `OWNER_ID`: Your Discord owner ID.

## Contributing

We welcome contributions! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under a custom license. It is only usable for personal usages with your own hosting and with visible credit to us. Commercial usage is strictly prohibited. If found, the commercial use company or individual would be charged as theft.

## Acknowledgements

- Special thanks to the original developers and the NextEra Development team for their efforts in reviewing and updating this project.
