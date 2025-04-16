declare module 'node:process' {
	global {
		namespace NodeJS {
			interface ProcessEnv {
				readonly DISCORD_TOKEN: string;
				readonly CLIENT_ID: string;
				readonly GUILD_ID: string;
				readonly Library_DB: string;
			}
		}
	}
}