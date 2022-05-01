const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    globalConfiguration,
    packageJson,
    MainLog
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "about",
    description: `Show basic informations about the bot.`,
    subcommands: {},
    aliases: [],
    slashCommandData: {
        options: []
    },
    permission: `commands.about`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let fields = [
            [`**Developer**`, `<@231461358200291330>`, true],
            [`**Original Idea**`, `<@330826518370451457>`, true],
            [`**Dobias Tray**`, `<@833178174207950869>`, true],
            [`**Guild Prefix**:`, `\`${guild.configurationManager.configuration.prefix}\``, true],
            [`**Global Prefix**`, `\`${globalConfiguration.configuration.globalPrefix}\``, true],
            [`**Uptime**`, `${prettyMilliseconds(client.uptime)}`, true],
            [`**Bot Version**`, `${packageJson.version}`, true],
            [`**NodeJS Version**`, `${process.version}`, true],
            [`**DiscordJS Version**`, `${packageJson.dependencies["discord.js"]}`, true],
            [`**Latency**`, `${Date.now() - message.createdTimestamp}ms`, true],
            [`**API Latency**`, `${Math.round(client.ws.ping)}ms`, true]
        ];
        return utils.sendMain(message, guild, `About`, undefined, fields, (isSlashCommand) ? {ephemeral: false} : true, (guild.configurationManager.configuration.behaviour.autoDeleteCommands) ? 0 : -1); /*Updated To New Utils*/
    }
}