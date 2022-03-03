const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    configuration,
    package,
    MainLog
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "about",
    description: `Show informations about the bot.`,
    subcommands: {},
    aliases: [],
    permission: `commands.about`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let fields = [
            [`**Developer**`, `<@231461358200291330>`, true],
            [`**Original Idea**`, `<@330826518370451457>`, true],
            [`**Dobias Tray**`, `<@833178174207950869>`, true],
            [`**Guild Prefix**:`, `\`${guild.configuration.prefix}\``, true],
            [`**Global Prefix**`, `\`${configuration.globalPrefix}\``, true],
            [`**Uptime**`, `${prettyMilliseconds(client.uptime)}`, true],
            [`**Bot Version**`, `${package.version}`, true],
            [`**NodeJS Version**`, `${process.version}`, true],
            [`**DiscordJS Version**`, `${package.dependencies["discord.js"]}`, true],
            [`**Latency**`, `${Date.now() - message.createdTimestamp}ms`, true],
            [`**API Latency**`, `${Math.round(client.ws.ping)}ms`, true]
        ];
        return utils.sendMain(message, guild, `About`, undefined, fields, true, (guild.configuration.behaviour.autoDeleteCommands) ? 0 : -1); /*Updated To New Utils*/
    }
}