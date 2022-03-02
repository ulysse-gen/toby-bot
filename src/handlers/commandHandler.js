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
    executionTimes[message.id].commandHandler = moment();
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
    if (typeof guild == "undefined") {
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][guild is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [guild is undefined]`, undefined, undefined, {
            title: `Command execution error`,
            description: `${message.content}`,
            color: `#FF0000`,
            fields: [
                [`Error:`, `guild is undefined`, true],
                [`Executor:`, `<@${message.author.id}>`, true],
                [`Channel:`, `<#${message.channel.id}>`, true],
                [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
            ]
        });
    }
    if (typeof client == "undefined") { //This can actually never happen
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][client is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [client is undefined]`, undefined, undefined, {
            title: `Command execution error`,
            description: `${message.content}`,
            color: guild.configuration.colors.error,
            fields: [
                [`Error:`, `client is undefined`, true],
                [`Executor:`, `<@${message.author.id}>`, true],
                [`Channel:`, `<#${message.channel.id}>`, true],
                [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
            ]
        });
    }
    if (typeof configuration == "undefined") { //This error shoud never happen. configuration is the main configuration and if its undefined no commands can work.
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][configuration is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [configuration is undefined]`, undefined, undefined, {
            title: `Command execution error`,
            description: `${message.content}`,
            color: guild.configuration.colors.error,
            fields: [
                [`Error:`, `configuration is undefined`, true],
                [`Executor:`, `<@${message.author.id}>`, true],
                [`Channel:`, `<#${message.channel.id}>`, true],
                [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
            ]
        });
    }
    if (typeof globalCommands == "undefined") { //This error shoud never happen. globalCommands is the main commandManager and if its undefined no commands can work.
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][globalCommands is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [globalCommands is undefined]`, undefined, undefined, {
            title: `Command execution error`,
            description: `${message.content}`,
            color: guild.configuration.colors.error,
            fields: [
                [`Error:`, `globalCommands is undefined`, true],
                [`Executor:`, `<@${message.author.id}>`, true],
                [`Channel:`, `<#${message.channel.id}>`, true],
                [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
            ]
        });
    }
    if (typeof globalPermissions == "undefined") { //This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][globalPermissions is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [globalPermissions is undefined]`, undefined, undefined, {
            title: `Command execution error`,
            description: `${message.content}`,
            color: guild.configuration.colors.error,
            fields: [
                [`Error:`, `globalPermissions is undefined`, true],
                [`Executor:`, `<@${message.author.id}>`, true],
                [`Channel:`, `<#${message.channel.id}>`, true],
                [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
            ]
        });
    }
    if ("COMMAND LOCK" == "COMMAND LOCK" && false) { //This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
        return utils.sendDenied(message, guild, `Lockdown`, `The bot is on lockdown. No commands can be executed.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][LOCKDOWN]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${message.content}\` in <#${message.channel.id}>(${message.channel.id}). [LOCKDOWN]`, undefined, undefined, {
            title: `Command denied`,
            description: `${message.content}`,
            color: guild.configuration.colors.error,
            fields: [
                [`Reason:`, `Command lockdown enabled`, true],
                [`Executor:`, `<@${message.author.id}>`, true],
                [`Channel:`, `<#${message.channel.id}>`, true],
                [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
            ]
        });
    }

    executionTimes[message.id].fetchingCommand = moment();
    let command = globalCommands.fetch(cmd);
    executionTimes[message.id].fetchedCommand = moment();

    if (!command) return utils.sendUnkownCommand(message, guild, `Unknown command`, undefined, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Unknown Command].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Unknown Command]`, undefined, undefined, {
        title: `Command denied`,
        description: `${message.content}`,
        color: guild.configuration.colors.error,
        fields: [
            [`Reason:`, `Unknown command`, true],
            [`Executor:`, `<@${message.author.id}>`, true],
            [`Channel:`, `<#${message.channel.id}>`, true],
            [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
        ]
    });

    executionTimes[message.id].gettingCommandPermission = moment();
    let permissionToCheck = command.permission;
    executionTimes[message.id].gettingCommandGlobalPermission = moment();
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    executionTimes[message.id].gotCommandGlobalPermission = moment();
    executionTimes[message.id].gettingCommandGuildPermission = moment();
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id);
    executionTimes[message.id].gotCommandGuildPermission = moment();
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    executionTimes[message.id].gotPermission = moment();
    if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`, undefined, undefined, {
        title: `Command denied`,
        description: `${message.content}`,
        color: guild.configuration.colors.error,
        fields: [
            [`Reason:`, `Insufficient Permissions`, true],
            [`Permission:`, `${command.permission}`, true],
            [`Executor:`, `<@${message.author.id}>`, true],
            [`Channel:`, `<#${message.channel.id}>`, true],
            [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
        ]
    });

    executionTimes[message.id].gettingCooldownPermission = moment();
    let cooldownPerm = `skipcooldowns.${command.permission}`;
    executionTimes[message.id].gettingCooldownGlobalPermission = moment();
    let hasSkipCooldownGlobalPerms = await globalPermissions.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id, true);
    executionTimes[message.id].gotCooldownGlobalPermission = moment();
    executionTimes[message.id].gettingCooldownGuildPermission = moment();
    let hasSkipCooldownGuildPerms = await guild.permissionsManager.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id);
    executionTimes[message.id].gotCooldownGuildPermission = moment();
    let hasSkipCooldownPerms = (hasSkipCooldownGlobalPerms == null) ? hasSkipCooldownGuildPerms : hasSkipCooldownGlobalPerms;
    executionTimes[message.id].gotCooldownPermission = moment();

    if (command.globalcooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.globalCooldowns[command.name] != "undefined") {
            return utils.sendCooldown(message, guild, `Cooldown`, undefined, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Cooldown].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Cooldown]`, undefined, undefined, {
                title: `Command denied`,
                description: `${message.content}`,
                color: guild.configuration.colors.error,
                fields: [
                    [`Reason:`, `Cooldown`, true],
                    [`Permission:`, `skipcooldowns.${command.permission}`, true],
                    [`Executor:`, `<@${message.author.id}>`, true],
                    [`Channel:`, `<#${message.channel.id}>`, true],
                    [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
                ]
            });
        } else {
            if (typeof globalCommands.globalCooldowns[command.name] == "undefined") globalCommands.globalCooldowns[command.name] = true;
            setTimeout(() => {
                delete globalCommands.globalCooldowns[command.name];
            }, command.globalCooldown * 1000)
        }
    if (command.cooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.cooldowns[message.author.id] != "undefined" && typeof globalCommands.cooldowns[message.author.id][command.name] != "undefined") {
            return utils.sendCooldown(message, guild, `Cooldown`, undefined, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Cooldown].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Cooldown]`, undefined, undefined, {
                title: `Command denied`,
                description: `${message.content}`,
                color: guild.configuration.colors.error,
                fields: [
                    [`Reason:`, `Cooldown`, true],
                    [`Permission:`, `skipcooldowns.${command.permission}`, true],
                    [`Executor:`, `<@${message.author.id}>`, true],
                    [`Channel:`, `<#${message.channel.id}>`, true],
                    [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
                ]
            });
        } else {
            if (typeof globalCommands.cooldowns[message.author.id] == "undefined") globalCommands.cooldowns[message.author.id] = {};
            globalCommands.cooldowns[message.author.id][command.name] = true;
            setTimeout(() => {
                delete globalCommands.cooldowns[message.author.id][command.name];
            }, command.globalCooldown * 1000)
        }

    executionTimes[message.id].typingSent = moment();
    message.channel.sendTyping();

    MainLog.log(`${message.author.tag}(${message.author.id}) executed '${cmd}' in [${message.channel.id}@${message.channel.guild.id}].`);
    let commandResult;
    if (typeof enableCatching == "boolean" && enableCatching == false) commandResult = await command.exec(client, message, args, guild);
    try {
        executionTimes[message.id].executingCommand = moment();
        if (typeof enableCatching == "undefined" || (typeof enableCatching == "boolean" && enableCatching == false)) commandResult = await command.exec(client, message, args, guild);
        executionTimes[message.id].commandExecuted = moment();
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
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][${e}]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Error in command code]`);
    }
}