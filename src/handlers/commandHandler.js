const {
    MessageEmbed
} = require(`discord.js`);
const colors = require(`colors`);

const {
    client,
    configuration,
    MainLog,
    MainSQLLog,
    globalPermissions,
    globalCommands
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = async function (message, guild = undefined) {
    let args = message.content.split(' ');
    args = args.filter(function(e) { return e !== '' });
    args = args.map(e => {if (typeof e == "string")return e.trim()});
    let cmd = args.shift(args);
    if (cmd.startsWith(configuration.globalPrefix))cmd = cmd.replace(configuration.globalPrefix, '');
    if (typeof guild != "undefined" && cmd.startsWith(guild.configuration.prefix))cmd = cmd.replace(guild.configuration.prefix, '');
    if (typeof guild == "undefined") {
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][guild is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [guild is undefined]`);
    }
    if (typeof client == "undefined") { //This can actually never happen
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][client is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [client is undefined]`);
    }
    if (typeof configuration == "undefined") { //This error shoud never happen. configuration is the main configuration and if its undefined no commands can work.
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][configuration is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [configuration is undefined]`);
    }
    if (typeof globalCommands == "undefined") { //This error shoud never happen. globalCommands is the main commandManager and if its undefined no commands can work.
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][globalCommands is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [globalCommands is undefined]`);
    }
    if (typeof globalPermissions == "undefined") { //This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][globalPermissions is undefined]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [globalPermissions is undefined]`);
    }
    if ("COMMAND LOCK" == "COMMAND LOCK" && false) { //This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
        return utils.sendDenied(message, guild, `Lockdown`, `The bot is on lockdown. No commands can be executed.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][LOCKDOWN]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${message.content}\` in <#${message.channel.id}>(${message.channel.id}). [LOCKDOWN]`);
    }

    let command = globalCommands.fetch(cmd);

    let cooldownPerm = `skipcooldowns.${command.permission}`;
    let hasSkipCooldownGlobalPerms = await globalPermissions.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasSkipCooldownGuildPerms = await guild.permissionsManager.userHasPermission(cooldownPerm, message.author.id, undefined, message.channel.id, message.guild.id);
    let hasSkipCooldownPerms = (hasSkipCooldownGlobalPerms == null) ? hasSkipCooldownGuildPerms : hasSkipCooldownGlobalPerms;

    if (command.globalcooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.cooldowns[message.author.id] != "undefined" && typeof globalCommands.cooldowns[message.author.id][command.name] != "undefined"){
            return utils.sendUnkownCommand(message, guild, `Cooldown`, undefined, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Unknown Command].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Cooldown]`);
        }else {
            if (typeof globalCommands.cooldowns[command.name] == "undefined")globalCommands.cooldowns[command.name] = true;
            globalCommands.cooldowns[command.name] = true;
            setTimeout(() => {delete globalCommands.globalCooldowns[command.name];}, command.globalcooldown*1000)
        }
    if (command.cooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.cooldowns[message.author.id] != "undefined" && typeof globalCommands.cooldowns[message.author.id][command.name] != "undefined"){
            return utils.sendUnkownCommand(message, guild, `Cooldown`, undefined, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Unknown Command].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Cooldown]`);
        }else {
            if (typeof globalCommands.cooldowns[message.author.id] == "undefined")globalCommands.cooldowns[message.author.id] = {};
            globalCommands.cooldowns[message.author.id][command.name] = true;
            setTimeout(() => {delete globalCommands.cooldowns[message.author.id][command.name];}, command.cooldown*1000)
        }

    if (!command) return utils.sendUnkownCommand(message, guild, `Unknown command`, undefined, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Unknown Command].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Unknown Command]`);


    let permissionToCheck = command.permission;
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

    MainSQLLog.log(`Command Execution`, `${message.content}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`${message.author.tag}(${message.author.id}) executed '${cmd}' in [${message.channel.id}@${message.channel.guild.id}].`);
    //let commandResult = await command.exec(client, message, args, guild);
    try {
        let commandResult = await command.exec(client, message, args, guild);
        if (typeof commandResult != "undefined") {
            if (typeof commandResult == "object")
                if (typeof guild != "undefined" && guild.configuration.behaviour.logCommandExecutions)
                    if (typeof commandResult.dontLog == "undefined" || commandResult.dontLog == false)
                        if (guild.logToChannel.initialized == true && cmd != "say" && cmd != "pleasesaythat") guild.channelLog(`<@${message.author.id}>(${message.author.id}) executed \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}).`);

           if (typeof commandResult == "function")commandResult();
        }
        if (typeof guild != "undefined" && guild.configuration.behaviour.logCommandExecutions)
                if (guild.logToChannel.initialized == true && cmd != "say" && cmd != "pleasesaythat") guild.channelLog(`<@${message.author.id}>(${message.author.id}) executed \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}).`);
        return true;
    } catch (e) {
        return utils.sendError(message, guild, `Error`, `A global error occured trying to execute the command \`${cmd}\``, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][${e}]`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Error in command code]`);
    }
}