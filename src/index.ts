import dotenv from 'dotenv';
import path from 'node:path';
import Database from 'better-sqlite3';
dotenv.config();

import { Client, Events, GatewayIntentBits } from 'discord.js';
import {
  DiscordInteractions,
  ErrorCodes,
  InteractionsError,
} from '@akki256/discord-interaction';
import { DiscordEvents } from './modules/events';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions
	],
});

// DB Check
const BohPJLibrary = new Database(process.env.Library_DB ?? '');
BohPJLibrary.prepare(`CREATE TABLE IF NOT EXISTS BohPJLibrary (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title string NOT NULL, donarId string NOT NULL)`).run();
BohPJLibrary.close();

const interactions = new DiscordInteractions(client);
interactions.loadRegistries(path.resolve(__dirname, './commands'));

const events = new DiscordEvents(client);
events.register(path.resolve(__dirname, './events'));

client.once(Events.ClientReady, (): void => {
  console.log('[INFO] BOT ready!');
  interactions.registerCommands({ guildId: process.env.GUILD_ID ?? undefined });
});

client.on(Events.InteractionCreate, (interaction): void => {
  if (!interaction.isRepliable()) return;

  interactions.run(interaction).catch((err) => {
    if (
      err instanceof InteractionsError &&
      err.code === ErrorCodes.CommandHasCoolTime
    ) {
      interaction.reply({
        content: '`⌛` コマンドはクールダウン中です',
        ephemeral: true,
      });
      return;
    }
    console.log(err);
  });
});

client.login();