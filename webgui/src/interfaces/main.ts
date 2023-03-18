export interface DiscordUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar: string;
  avatar_decoration: null;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: string | null;
  banner_color: null;
  accent_color: null;
  locale: string;
  mfa_enabled: boolean;
  premium_type: number;
  email: string;
  verified: boolean;
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
  guilds: Array<DiscordGuild>;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: number;
  features: Array<string>;
  permissions_new: string;
}

export interface DiscordGuildToby {
  numId: number;
  configuration: ConfigurationDepth;
  guild: {
    id: string;
    name: string;
    icon: string;
    features: Array<any>;
    commands: Array<any>;
    members: Array<string>;
    channels: Array<string>;
    bans: Array<string>;
    roles: Array<string>;
    stageInstances: Array<any>;
    invites: Array<any>;
    scheduledEvents: Array<any>;
    shardId: number;
    splash: any;
    banner: string | null;
    description: string | null;
    verificationLevel: string;
    vanityURLCode: string;
    nsfwLevel: string;
    discoverySplash: any;
    memberCount: number;
    large: boolean;
    premiumProgressBarEnabled: boolean;
    applicationId: any;
    afkTimeout: number;
    afkChannelId: string | null;
    systemChannelId: string | null;
    premiumTier: string;
    premiumSubscriptionCount: number;
    explicitContentFilter: string;
    mfaLevel: string;
    joinedTimestamp: number;
    defaultMessageNotifications: string;
    systemChannelFlags: number;
    maximumMembers: number;
    maximumPresences: any;
    approximateMemberCount: any;
    approximatePresenceCount: any;
    vanityURLUses: any;
    rulesChannelId: string | null;
    publicUpdatesChannelId: string | null;
    preferredLocale: string;
    ownerId: string;
    emojis: Array<any>;
    stickers: Array<any>;
    createdTimestamp: number;
    nameAcronym: string;
    iconURL: URL;
    splashURL: URL | null;
    discoverySplashURL: URL | null;
    bannerURL: URL | null;
  };
  locale: string;
  isSetup: boolean;
}

export interface DocumentationEntry {
  name: string;
  description: string;
  type: string;
  editable: boolean;
  default: any;
}

export type ConfigurationEntry = {
  name: string;
  description: string;
  type: string;
  typeText: string;
  editable: boolean;
  defaultValue: any;
  defaultValueDisplay: string;
  value: any;
};

export type ConfigurationEntryPath = {
  name: string;
  description: string;
  type: string;
  typeText: string;
  editable: boolean;
  defaultValue: any;
  defaultValueDisplay: string;
  value: any;
  path: string;
};

export interface DocumentationEntryPath {
  name: string;
  description: string;
  type: string;
  typeText: string;
  editable: boolean;
  defaultValue: any;
  defaultValueDisplay: string;
  path: string;
}

export interface ConfigurationDepth {
  [key: string]: ConfigurationEntry | ConfigurationDepth;
}

export interface DocumentationDepth {
  [key: string]: DocumentationEntry | DocumentationDepth;
}

export type DocumentationList = Array<DocumentationEntryPath>;
export type ConfigurationList = Array<ConfigurationEntryPath>;
