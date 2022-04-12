const {
    MessageEmbed
} = require(`discord.js`);
const colors = require(`colors`);
const moment = require(`moment`);

const {
    client,
    configuration,
    MainLog,
    MainSQLLog,
    globalPermissions,
    globalCommands,
    executionTimes,
    enableCatching
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = async function (message, guild = undefined) {
    let messageMetric =  message.customMetric;
    messageMetric.addEntry(`CommandHandlerStart`);
    let args = message.content.split(' ');
    args = args.filter(function (e) {
        return e !== ''
    });
    args = args.map(e => {
        if (typeof e == "string") return e.trim()
    });
    let cmd = args.shift(args);
    if (cmd.startsWith(configuration.globalPrefix)) cmd = cmd.replace(configuration.globalPrefix, '');
    if (typeof guild != "undefined" && cmd.startsWith(guild.configuration.prefix)) cmd = cmd.replace(guild.configuration.prefix, '');
    if (typeof client == "undefined") return utils.sendError(message, guild, undefined, `Client is undefined`, [], true, -1, -1); //This can actually never happen
    if (typeof globalCommands == "undefined") return utils.sendError(message, guild, undefined, `globalCommands is undefined`, [], true, -1, -1); //This error shoud never happen. globalCommands is the main commandManager and if its undefined no commands can work.
    if (typeof globalPermissions == "undefined") return utils.sendError(message, guild, undefined, `globalPermissions is undefined`, [], true, -1, -1);//This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
    //if (false) return utils.lockdownDenied(message, guild, undefined, undefined, [], true, -1, -1)

    messageMetric.addEntry(`FetchingCommand`);
    let command = globalCommands.fetch(cmd);
    messageMetric.addEntry(`FetchedCommand`);

    if (!command) return utils.unknownCommand(message, guild, true, (guild.configuration.behaviour.deleteMessageOnUnknown) ? 5000 : -1, (guild.configuration.behaviour.deleteMessageOnUnknown) ? 5000 : -1);

    let permissionToCheck = command.permission;
    messageMetric.addEntry(`GettingGlobalPermissions`);
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    messageMetric.addEntry(`GotGlobalPermissions`);
    messageMetric.addEntry(`GettingGuildPermissions`);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id);
    messageMetric.addEntry(`GotGuildPermissions`);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    messageMetric.addEntry(`GotPermissions`);
    if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, (guild.configuration.behaviour.deleteMessageOnDeny) ? 5000 : -1, (guild.configuration.behaviour.deleteMessageOnDeny) ? 5000 : -1);

    let cooldownPerm = `skipcooldowns.${command.permission}`;
    messageMetric.addEntry(`GettingCooldownGlobalPermission`);
    let hasSkipCooldownGlobalPerms = await globalPermissions.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id, true);
    messageMetric.addEntry(`GotCooldownGlobalPermission`);
    messageMetric.addEntry(`GettingCooldownGuildPermission`);
    let hasSkipCooldownGuildPerms = await guild.permissionsManager.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id);
    messageMetric.addEntry(`GotCooldownGuildPermission`);
    let hasSkipCooldownPerms = (hasSkipCooldownGlobalPerms == null) ? hasSkipCooldownGuildPerms : hasSkipCooldownGlobalPerms;
    messageMetric.addEntry(`GotCooldownPermissions`);

    if (command.globalcooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.globalCooldowns[command.name] != "undefined") {
            return utils.cooldownCommand(message, guild, cooldownPerm, true, (guild.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1, (guild.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1);
        } else {
            if (typeof globalCommands.globalCooldowns[command.name] == "undefined") globalCommands.globalCooldowns[command.name] = true;
            setTimeout(() => {
                delete globalCommands.globalCooldowns[command.name];
            }, command.globalCooldown * 1000)
        }
    if (command.cooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.cooldowns[message.author.id] != "undefined" && typeof globalCommands.cooldowns[message.author.id][command.name] != "undefined") {
            return utils.cooldownCommand(message, guild, cooldownPerm, true, (guild.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1, (guild.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1);
        } else {
            if (typeof globalCommands.cooldowns[message.author.id] == "undefined") globalCommands.cooldowns[message.author.id] = {};
            globalCommands.cooldowns[message.author.id][command.name] = true;
            setTimeout(() => {
                delete globalCommands.cooldowns[message.author.id][command.name];
            }, command.globalCooldown * 1000)
        }

    messageMetric.addEntry(`TypingEventSent`);
    message.channel.sendTyping();

    MainLog.log(`${message.author.tag}(${message.author.id}) executed '${cmd}' in [${message.channel.id}@${message.channel.guild.id}].`);
    let commandResult;
    if (typeof enableCatching == "boolean" && enableCatching == false) commandResult = await command.exec(client, message, args, guild);
    try {
        messageMetric.addEntry(`ExecutingCommand`);
        if (typeof commandResult == "undefined") commandResult = await command.exec(client, message, args, guild);
        messageMetric.addEntry(`ExecutedCommand`);
        if (typeof commandResult != "undefined") {
            if (typeof commandResult == "object")
                if (typeof guild != "undefined" && guild.configuration.behaviour.logCommandExecutions)
                    if (typeof commandResult.dontLog == "undefined" || commandResult.dontLog == false)
                        if (guild.logToChannel.initialized == true && cmd != "say" && cmd != "pleasesaythat")
                            if (!guild.configuration.behaviour.logToChannel.embed) {
                                guild.channelLog(`<@${message.author.id}>(${message.author.id}) executed \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}).`);
                            } else {
                                guild.channelEmbedLog(`Command execution`, `${message.content}`, guild.configuration.colors.main, [
                                    [`Executor:`, `<@${message.author.id}>`, true],
                                    [`Channel:`, `<#${message.channel.id}>`, true],
                                    [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
                                ]);
                            }

            if (typeof commandResult == "function") commandResult();
        }
        if (typeof guild != "undefined" && guild.configuration.behaviour.logCommandExecutions)
            if (guild.logToChannel.initialized == true && cmd != "say" && cmd != "pleasesaythat")
                if (!guild.configuration.behaviour.logToChannel.embed) {
                    guild.channelLog(`<@${message.author.id}>(${message.author.id}) executed \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}).`);
                } else {
                    guild.channelEmbedLog(`Command execution`, `${message.content}`, guild.configuration.colors.main, [
                        [`Executor:`, `<@${message.author.id}>`, true],
                        [`Channel:`, `<#${message.channel.id}>`, true],
                        [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
                    ]);
                }
        return true;
    } catch (e) {
        return utils.sendError(message, guild, undefined, `An error occured withing the command code.`, [], true, 5000, 5000);
    }
}