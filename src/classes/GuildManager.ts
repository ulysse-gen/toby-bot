/////////////////////////////////
//GuildManager is the main class for Guilds Management
/////////////////////////////////

//Importing classes
import { Guild as DiscordGuild } from 'discord.js';
import Guild from './Guild';
import TobyBot from './TobyBot';

export default class GuildManager {
    TobyBot: TobyBot;
    SQLPool: any;
    guilds: {[key: string]: Guild};
    constructor(TobyBot: TobyBot) {
        this.TobyBot = TobyBot;

        this.SQLPool = TobyBot.SQLPool;

        this.guilds = {};
    }

    async getGuildById(guildId: string) {
        if (typeof this.guilds[guildId] != "undefined")return this.guilds[guildId];
        let guild = await this.TobyBot.client.guilds.fetch(guildId).catch(e=>undefined)
        if (typeof guild == "undefined" || guild.available == false)return undefined;
        this.guilds[guildId] = new Guild(this, guild);
        await this.guilds[guildId].initialize().catch(e => { 
            delete this.guilds[guildId];
            throw e;
         });
        return this.guilds[guildId];
    }

    async getGuild(guild: DiscordGuild) {
        if (typeof this.guilds[guild.id] == "object" && typeof this.guilds[guild.id].Guild != "undefined") return this.guilds[guild.id];
        this.guilds[guild.id] = new Guild(this, guild);
        await this.guilds[guild.id].initialize().catch(e => { 
            delete this.guilds[guild.id];
            throw e;
         });
        return this.guilds[guild.id];
    }
}