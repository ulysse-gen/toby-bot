/////////////////////////////////
//GuildManager is the main class for Guilds Management
/////////////////////////////////

//Importing NodeJS modules
const mysql = require(`mysql`);

//Importing classes
const Guild = require('./Guild');

module.exports = class GuildManager {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.SQLPool = mysql.createPool({"host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD,"database":process.env.MARIADB_DATABASE,"charset":process.env.MARIADB_CHARSET,"connectionLimit":process.env.MARIADB_CONNECTION_LIMIT});

        this.guilds = {};
    }

    async getGuildById(guildId) {
        if (typeof this.guilds[guildId] != "undefined")return this.guilds[guildId];
        let guild = await this.TobyBot.client.guilds.fetch(guildId, {
            force: true
        }).catch(e=>undefined)
        if (typeof guild == "undefined" || guild.available == false)return undefined;
        this.guilds[guildId] = new Guild(this, guild);
        await this.guilds[guildId].initialize().catch(e => { 
            delete this.guilds[guildId];
            throw e;
         });
        return this.guilds[guildId];
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