const colors = require("colors");
const fs = require('fs');
const moment = require('moment');

module.exports = class discordChannelLogger {
    constructor(client, config, guildId, channelId, defaultType = "MAIN") {
        this.client = client;
        this.config = config;
        this.defaultType = defaultType;
        this.pattern = "[&{DISCORDDATE}] : &{TEXT}";
        this.initialized = false;

        this.init(guildId, channelId);
    }

    async init(guildId, channelId) {
        var globalThis = this;
        try {
            await this.client.guilds.fetch(guildId).then(guild => {
                guild.channels.fetch(channelId).then(channel => {
                    globalThis.logChannel = channel;
                    this.initialized = true;
                });
            });
        } catch (e) {}
        return true;
    }

    async log(string, type = this.defaultType, onlyType = undefined) {
        if (!this.initialized || !this.config.behaviour.logToChannel.status) return;
        if (typeof string != "string" && string == "") return false;
        if (typeof type != "string" && type == "") return false;
        let logText = this.pattern.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`MMMM Do YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss`)).replace(`&{DISCORDDATE}`, `<t:${Math.floor(new Date().getTime() / 1000)}:F>`).replace(`&{TYPE}`, `${type}`);

        this.logChannel.send(logText);
        return true;
    }
}