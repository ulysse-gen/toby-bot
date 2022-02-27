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
    name: "commandexecutionstatistics",
    description: `Show stats about a command execution.`,
    subcommands: {},
    aliases: ["cmdexecstats"],
    permission: `commands.commandexecstats`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) return utils.sendError(message, guild, `Error`, `Please tell me the message id.`);
        let messageId = args.shift();
        if (typeof executionTimes[messageId] == "undefined") return utils.sendError(message, guild, `Error`, `No records for this one.`);
        let content = `Stats of the command execution from the message ${messageId}`;
        if (typeof executionTimes[messageId].messageCreate != "undefined") content += `\nMessage received : ${executionTimes[messageId].messageCreate}`;
        if (typeof executionTimes[messageId].gettingGuild != "undefined") content += `\nGetting guild : ${executionTimes[messageId].gettingGuild} (+${executionTimes[messageId].gettingGuild.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotGuild != "undefined") content += `\nGot guild : ${executionTimes[messageId].gotGuild} (+${executionTimes[messageId].gotGuild.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].chatModeration != "undefined") content += `\nTransfer to chat moderation : ${executionTimes[messageId].chatModeration} (+${executionTimes[messageId].chatModeration.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].commandHandler != "undefined") content += `\nLoaded into command handler : ${executionTimes[messageId].commandHandler} (+${executionTimes[messageId].commandHandler.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].fetchingCommand != "undefined") content += `\nFetching command : ${executionTimes[messageId].fetchingCommand} (+${executionTimes[messageId].fetchingCommand.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].fetchedCommand != "undefined") content += `\nFetched command : ${executionTimes[messageId].fetchedCommand} (+${executionTimes[messageId].fetchedCommand.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gettingCommandPermission != "undefined") content += `\nGetting command permission : ${executionTimes[messageId].gettingCommandPermission} (+${executionTimes[messageId].gettingCommandPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gettingCommandGlobalPermission != "undefined") content += `\nGetting command global permission : ${executionTimes[messageId].gettingCommandGlobalPermission} (+${executionTimes[messageId].gettingCommandGlobalPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotCommandGlobalPermission != "undefined") content += `\nGot command global permission : ${executionTimes[messageId].gotCommandGlobalPermission} (+${executionTimes[messageId].gotCommandGlobalPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gettingCommandGuildPermission != "undefined") content += `\nGetting command guild permission : ${executionTimes[messageId].gettingCommandGuildPermission} (+${executionTimes[messageId].gettingCommandGuildPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotCommandGuildPermission != "undefined") content += `\nGot command guild permission : ${executionTimes[messageId].gotCommandGuildPermission} (+${executionTimes[messageId].gotCommandGuildPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotPermission != "undefined") content += `\nGot permission : ${executionTimes[messageId].gotPermission} (+${executionTimes[messageId].gotPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gettingCooldownPermission != "undefined") content += `\nGetting cooldown permission : ${executionTimes[messageId].gettingCooldownPermission} (+${executionTimes[messageId].gettingCooldownPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gettingCooldownGlobalPermission != "undefined") content += `\nGetting global cooldown permission : ${executionTimes[messageId].gettingCooldownGlobalPermission} (+${executionTimes[messageId].gettingCooldownGlobalPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotCooldownGlobalPermission != "undefined") content += `\nGot global cooldown permission : ${executionTimes[messageId].gotCooldownGlobalPermission} (+${executionTimes[messageId].gotCooldownGlobalPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gettingCooldownGuildPermission != "undefined") content += `\nGetting guild cooldown permission : ${executionTimes[messageId].gettingCooldownGuildPermission} (+${executionTimes[messageId].gettingCooldownGuildPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotCooldownGuildPermission != "undefined") content += `\nGot guild cooldown permission : ${executionTimes[messageId].gotCooldownGuildPermission} (+${executionTimes[messageId].gotCooldownGuildPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].gotCooldownPermission != "undefined") content += `\nGot cooldown permission : ${executionTimes[messageId].gotCooldownPermission} (+${executionTimes[messageId].gotCooldownPermission.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].typingSent != "undefined") content += `\nSending typing event : ${executionTimes[messageId].typingSent} (+${executionTimes[messageId].typingSent.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].executingCommand != "undefined") content += `\nExecuting command : ${executionTimes[messageId].executingCommand} (+${executionTimes[messageId].executingCommand.diff(executionTimes[messageId].messageCreate)}ms)`;
        if (typeof executionTimes[messageId].commandExecuted != "undefined") content += `\nCommand executed : ${executionTimes[messageId].commandExecuted} (+${executionTimes[messageId].commandExecuted.diff(executionTimes[messageId].messageCreate)}ms)`;
        message.reply({
            content: content,
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}

function ArrayAvg(myArray) {
    var i = 0,
        summ = 0,
        ArrayLen = myArray.length;
    while (i < ArrayLen) {
        summ = summ + myArray[i++];
    }
    return summ / ArrayLen;
}