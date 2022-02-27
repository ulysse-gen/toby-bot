const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    configuration,
    package,
    MainLog,
    executionTimes
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "botstats",
    description: `Show stats about the bot.`,
    subcommands: {},
    aliases: [],
    permission: `commands.botstats`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Botstats ${configuration.appName}`,
            color: guild.configuration.colors.main
        });
        let commandExecutionsStats = {
            fullExecution: [],
            permissionGrabbing: [],
            execution: []
        }
        for (const key in executionTimes) {
            if (typeof executionTimes[key].messageCreate != "undefined" && typeof executionTimes[key].commandExecuted != "undefined")commandExecutionsStats.fullExecution.push(executionTimes[key].commandExecuted.diff(executionTimes[key].messageCreate));
            if (typeof executionTimes[key].gettingCommandPermission != "undefined" && typeof executionTimes[key].gotPermission != "undefined")commandExecutionsStats.permissionGrabbing.push(executionTimes[key].gotPermission.diff(executionTimes[key].gettingCommandPermission));
            if (typeof executionTimes[key].executingCommand != "undefined" && typeof executionTimes[key].commandExecuted != "undefined")commandExecutionsStats.execution.push(executionTimes[key].commandExecuted.diff(executionTimes[key].executingCommand));
        }
        embed.addField(`**Full command execution**`, `${(commandExecutionsStats.fullExecution.length == 0) ? `No stats yet` : `${(ArrayAvg(commandExecutionsStats.fullExecution)).toFixed(2)}ms`}`, true);
        embed.addField(`**Permission grabbing**`, `${(commandExecutionsStats.permissionGrabbing.length == 0) ? `No stats yet` : `${(ArrayAvg(commandExecutionsStats.permissionGrabbing).toFixed(2))}ms`}`, true);
        embed.addField(`**Command execution**`, `${(commandExecutionsStats.execution.length == 0) ? `No stats yet` : `${(ArrayAvg(commandExecutionsStats.execution)).toFixed(2)}ms`}`, true);
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

function ArrayAvg(myArray) {
    var i = 0, summ = 0, ArrayLen = myArray.length;
    while (i < ArrayLen) {
        summ = summ + myArray[i++];
}
    return summ / ArrayLen;
}