/////////////////////////////////
//GuildManager is the main class for Guilds Management
/////////////////////////////////

//Importing classes
const Guild = require('./Guild');

module.exports = class GuildManager {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.guilds = {};
    }

    async getGuildById(guildId) {
        if (typeof this.guilds[guildId] != "undefined")return this.guilds[guildId];
        return undefined;
    }

    async getGuild(guild) {
        if (typeof this.guilds[guild.id] == "object" && typeof this.guilds[guild.id].guild != "undefined") return this.guilds[guild.id];
        this.guilds[guild.id] = new Guild(this, guild);
        await this.guilds[guild.id].initialize().catch(e => { 
            delete this.guilds[guild.id];
            throw e;
         });
        return this.guilds[guild.id];
    }
}