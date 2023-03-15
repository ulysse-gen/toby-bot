export interface DiscordUser {
  id: string;
}

export interface DiscordToken {
  access_token: string;
  expireIn: string;
  refresh_token: string;
}

export interface TobyBotToken {
  token: string;
  expireIn: string;
}

export interface MainStore {
  user: DiscordUser | null;
  discordToken: DiscordToken | null;
  tobybotToken: TobyBotToken | null;
}