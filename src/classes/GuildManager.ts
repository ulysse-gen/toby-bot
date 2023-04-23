/////////////////////////////////
//GuildManager is the main class for Guilds Management
/////////////////////////////////

//Importing classes
import { Collection, Guild as DiscordGuild } from 'discord.js';
import Guild from './Guild';
import TobyBot from './TobyBot';

export default class GuildManager {
    TobyBot: TobyBot;
    SQLPool: any;
    guilds: Collection<string, Guild>;
    constructor(TobyBot: TobyBot) {
        this.TobyBot = TobyBot;

        this.SQLPool = TobyBot.SQLPool;

        this.guilds = new Collection<string, Guild>;
    }

    async getGuildById(guildId: string) {
        if (this.guilds.has(guildId))return this.guilds.get(guildId);
        const FetchedGuild: DiscordGuild = await this.TobyBot.client.guilds.fetch(guildId).catch(()=>undefined);
        if (!FetchedGuild || !FetchedGuild.available)return undefined;
        this.guilds.set(guildId, new Guild(this, FetchedGuild));
        await this.guilds.get(guildId).initialize().catch(e => {
            this.guilds.delete(guildId);
            throw e;
        })
        return this.guilds.get(guildId);
    }

    async getGuild(guild: DiscordGuild) {
        if (this.guilds.has(guild.id))return this.guilds.get(guild.id);
        this.guilds.set(guild.id, new Guild(this, guild));
        await this.guilds.get(guild.id).initialize().catch(e => {
            this.guilds.delete(guild.id);
            throw e;
        })
        return this.guilds.get(guild.id);
    }
}