//Import classes
const guildManager = require(`./guildManager`);

module.exports = class guildsManager {
    constructor (client) {
        this.client = client;
        this.guilds = {};
    }

    async getGuild(guild) {
        if (typeof this.guilds[guild.id] == "object" && typeof this.guilds[guild.id].guild != "undefined")return this.guilds[guild.id];
        this.guilds[guild.id] = new guildManager(this.client, guild, this); 
        await this.guilds[guild.id].initialize();
        return this.guilds[guild.id];
    }
}