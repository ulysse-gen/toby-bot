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
        let embed = new MessageEmbed({
            title: `About ${configuration.appName}`,
            color: guild.configuration.colors.main
        });
        embed.addField(`**Developer**`, `<@231461358200291330>`, true);
        embed.addField(`**Original Idea**`, `<@330826518370451457>`, true);
        embed.addField(`**Dobias Tray**`, `<@833178174207950869>`, true);
        if (typeof guild != "undefined") embed.addField(`**Guild Prefix**:`, `\`${guild.configuration.prefix}\``, true);
        embed.addField(`**Global Prefix**`, `\`${configuration.globalPrefix}\``, true)
        embed.addField(`**Uptime**`, `${prettyMilliseconds(client.uptime)}`, true);
        embed.addField(`**Bot Version**`, `${package.version}`, true);
        embed.addField(`**NodeJS Version**`, `${process.version}`, true);
        embed.addField(`**DiscordJS Version**`, `${package.dependencies["discord.js"]}`, true);
        embed.addField(`**Latency**`, `${Date.now() - message.createdTimestamp}ms`, true);
        embed.addField(`**API Latency**`, `${Math.round(client.ws.ping)}ms`, true);

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}