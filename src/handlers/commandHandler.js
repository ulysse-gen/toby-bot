const moment = require(`moment`);

const {
    client,
    globalConfiguration,
    MainLog,
    globalPermissions,
    globalCommands,
    errorCatching
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = async function (message, guild = undefined, isSlashCommand = false) {
    let messageMetric = message.customMetric;
    messageMetric.addEntry(`CommandHandlerStart`);
    let cmd;
    let args;

    if (isSlashCommand) {
        cmd = message.commandName;
        args = message.options._hoistedOptions.map(o => o.value).join(' ').split(' ');

        message.author = await guild.guild.members.fetch(message.user.id).then(u => u.user).catch((e) => message.user);
        message.channel = client.channels.fetch(message.channelId).catch(() => {
            return {
                id: message.channelId,
                send: () => {
                    console.log('Could not send.')
                }
            }
        });
    } else {

        args = message.content.split(' ');
        args = args.filter(function (e) {
            return e !== ''
        });
        args = args.map(e => {
            if (typeof e == "string") return e.trim()
        });
        cmd = args.shift(args);
        if (cmd.startsWith(globalConfiguration.configuration.globalPrefix)) cmd = cmd.replace(globalConfiguration.configuration.globalPrefix, '');
        if (typeof guild != "undefined" && cmd.startsWith(guild.configurationManager.configuration.prefix)) cmd = cmd.replace(guild.configurationManager.configuration.prefix, '');
    }

    if (isSlashCommand) message.content =  `/${cmd} ${args.join(' ')}`;

    if (typeof cmd == "undefined" || typeof args == "undefined") return utils.sendError(message, guild, undefined, `wat`, [], (isSlashCommand) ? {ephemeral: true} : true, -1, -1); //This can actually never happen
    if (typeof client == "undefined") return utils.sendError(message, guild, undefined, `Client is undefined`, [], (isSlashCommand) ? {ephemeral: true} : true, -1, -1); //This can actually never happen
    if (typeof globalCommands == "undefined") return utils.sendError(message, guild, undefined, `globalCommands is undefined`, [], (isSlashCommand) ? {ephemeral: true} : true, -1, -1); //This error shoud never happen. globalCommands is the main commandManager and if its undefined no commands can work.
    if (typeof globalPermissions == "undefined") return utils.sendError(message, guild, undefined, `globalPermissions is undefined`, [], (isSlashCommand) ? {ephemeral: true} : true, -1, -1); //This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
    //if (false) return utils.lockdownDenied(message, guild, (isSlashCommand) ? {ephemeral: true} : true, undefined, [], true, -1, -1)

    messageMetric.addEntry(`FetchingCommand`);
    let command = globalCommands.fetch(cmd);
    messageMetric.addEntry(`FetchedCommand`);

    if (!command) return utils.unknownCommand(message, guild, (isSlashCommand) ? {ephemeral: true} : true, (guild.configurationManager.configuration.behaviour.deleteMessageOnUnknown) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnUnknown) ? 5000 : -1);

    let permissionToCheck = command.permission;
    messageMetric.addEntry(`GettingGlobalPermissions`);
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    messageMetric.addEntry(`GotGlobalPermissions`);
    messageMetric.addEntry(`GettingGuildPermissions`);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id);
    messageMetric.addEntry(`GotGuildPermissions`);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    messageMetric.addEntry(`GotPermissions`);
    if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, (isSlashCommand) ? {ephemeral: true} : true, (guild.configurationManager.configuration.behaviour.deleteMessageOnDeny) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnDeny) ? 5000 : -1);

    let cooldownPerm = `skipcooldowns.${command.permission}`;
    messageMetric.addEntry(`GettingCooldownGlobalPermission`);
    let hasSkipCooldownGlobalPerms = await globalPermissions.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id, true);
    messageMetric.addEntry(`GotCooldownGlobalPermission`);
    messageMetric.addEntry(`GettingCooldownGuildPermission`);
    let hasSkipCooldownGuildPerms = await guild.permissionsManager.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id);
    messageMetric.addEntry(`GotCooldownGuildPermission`);
    let hasSkipCooldownPerms = (hasSkipCooldownGlobalPerms == null) ? hasSkipCooldownGuildPerms : hasSkipCooldownGlobalPerms;
    messageMetric.addEntry(`GotCooldownPermissions`);


    if (!hasSkipCooldownPerms) {
        if (typeof globalCommands.cooldowns[message.author.id] != "undefined" && typeof globalCommands.cooldowns[message.author.id][command.name] != "undefined") {
            if (globalCommands.cooldowns[message.author.id][command.name].diff(moment(), 'seconds') >= 0) return utils.cooldownCommand(message, guild, {
                perm: cooldownPerm,
                timeLeft: globalCommands.cooldowns[message.author.id][command.name].diff(moment(), 'seconds')
            }, (isSlashCommand) ? {ephemeral: true} : true, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1);
        }
        if (typeof globalCommands.globalCooldowns[command.name] != "undefined") {
            if (globalCommands.globalCooldowns[command.name].diff(moment(), 'seconds') >= 0) return utils.cooldownCommand(message, guild, {
                perm: cooldownPerm,
                timeLeft: globalCommands.globalCooldowns[command.name].diff(moment(), 'seconds')
            }, (isSlashCommand) ? {ephemeral: true} : true, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1);
        }
        if (typeof globalCommands.cooldowns[message.author.id] == "undefined") globalCommands.cooldowns[message.author.id] = {};
        globalCommands.cooldowns[message.author.id][command.name] = moment().add(command.cooldown, 'seconds');
        globalCommands.globalCooldowns[command.name] = moment().add(command.globalCooldown, 'seconds');
    }

    messageMetric.addEntry(`TypingEventSent`);
    message.channel.sendTyping();

    MainLog.log(`${message.author.tag}(${message.author.id}) executed '${cmd}' in [${message.channel.id}@${message.channel.guild.id}].`);
    let commandResult;
    if (typeof errorCatching == "boolean" && !errorCatching) commandResult = await command.exec(client, message, args, guild, isSlashCommand);
    try {
        messageMetric.addEntry(`ExecutingCommand`);
        if (typeof errorCatching == "boolean" && errorCatching) commandResult = await command.exec(client, message, args, guild, isSlashCommand);
        messageMetric.addEntry(`ExecutedCommand`);
        if (typeof commandResult != "undefined") {
            if (typeof commandResult == "object")
                if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logCommandExecutions)
                    if (typeof commandResult.dontLog == "undefined" || commandResult.dontLog)
                        if (guild.logToChannel.initialized && cmd != "say" && cmd != "pleasesaythat")
                            if (!guild.configurationManager.configuration.behaviour.logToChannel.embed) {
                                guild.channelLog(`<@${message.author.id}>(${message.author.id}) executed \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}).`);
                            } else {
                                guild.channelEmbedLog(`Command execution`, `${message.content}`, guild.configurationManager.configuration.colors.main, [
                                    [`Executor:`, `<@${message.author.id}>`, true],
                                    [`Channel:`, `<#${message.channel.id}>`, true],
                                    [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
                                ]);
                            }

            if (typeof commandResult == "function") commandResult();
        }
        if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logCommandExecutions)
            if (guild.logToChannel.initialized && cmd != "say" && cmd != "pleasesaythat")
                if (!guild.configurationManager.configuration.behaviour.logToChannel.embed) {
                    guild.channelLog(`<@${message.author.id}>(${message.author.id}) executed \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}).`);
                } else {
                    guild.channelEmbedLog(`Command execution`, `${message.content}`, guild.configurationManager.configuration.colors.main, [
                        [`Executor:`, `<@${message.author.id}>`, true],
                        [`Channel:`, `<#${message.channel.id}>`, true],
                        [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
                    ]);
                }
        return true;
    } catch (e) {
        return utils.sendError(message, guild, undefined, `An error occured within the command code.`, [], (isSlashCommand) ? {ephemeral: true} : true, 5000, 5000);
    }
}