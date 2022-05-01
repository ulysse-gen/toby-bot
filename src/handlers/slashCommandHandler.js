const {
    MessageEmbed,
    Interaction
} = require(`discord.js`);
const colors = require(`colors`);
const moment = require(`moment`);

const {
    client,
    MainLog,
    globalCommands,
    globalPermissions,
    errorCatching,
    globalMetrics
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = async function (interaction, guild = undefined) {
    let cmd = interaction.commandName;
    let args = interaction.options._hoistedOptions.map(o => o.value).join(' ').split(' ');

    interaction.author = await guild.guild.members.fetch(interaction.user.id).catch((e) => interaction.user)
    interaction.channel = client.channels.fetch(interaction.channelId).catch(()=>{return {id: interaction.channelId, send: ()=>{console.log('Could not send.')}}});

    if (typeof client == "undefined") return utils.sendError(interaction, guild, undefined, `Client is undefined`, [], true, -1, -1); //This can actually never happen
    if (typeof globalCommands == "undefined") return utils.sendError(interaction, guild, undefined, `globalCommands is undefined`, [], true, -1, -1); //This error shoud never happen. globalCommands is the main commandManager and if its undefined no commands can work.
    if (typeof globalPermissions == "undefined") return utils.sendError(interaction, guild, undefined, `globalPermissions is undefined`, [], true, -1, -1); //This error shoud never happen. globalPermissions is the main permissionsManager and if its undefined no commands can work.
    if (false) return utils.lockdownDenied(interaction, guild, undefined, undefined, [], true, -1, -1)

    let command = globalCommands.fetch(cmd);
    if (!command) return utils.unknownCommand(interaction, guild, true, (guild.configurationManager.configuration.behaviour.deleteMessageOnUnknown) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnUnknown) ? 5000 : -1);

    let permissionToCheck = command.permission;
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, interaction.user.id, undefined, interaction.channelId, interaction.guildId, true);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, interaction.user.id, undefined, interaction.channelId, interaction.guildId);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    if (!hasPermission) return utils.insufficientPermissions(interaction, guild, permissionToCheck, true, (guild.configurationManager.configuration.behaviour.deleteMessageOnDeny) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnDeny) ? 5000 : -1);

    let cooldownPerm = `skipcooldowns.${command.permission}`;
    let hasSkipCooldownGlobalPerms = await globalPermissions.userHasPermission(cooldownPerm, interaction.user.id, undefined, interaction.channelId, interaction.guildId, true);
    let hasSkipCooldownGuildPerms = await guild.permissionsManager.userHasPermission(cooldownPerm, interaction.user.id, undefined, interaction.channelId, interaction.guildId);
    let hasSkipCooldownPerms = (hasSkipCooldownGlobalPerms == null) ? hasSkipCooldownGuildPerms : hasSkipCooldownGlobalPerms;

    if (command.globalcooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.globalCooldowns[command.name] != "undefined") {
            return utils.cooldownCommand(interaction, guild, cooldownPerm, true, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1);
        } else {
            if (typeof globalCommands.globalCooldowns[command.name] == "undefined") globalCommands.globalCooldowns[command.name] = true;
            setTimeout(() => {
                delete globalCommands.globalCooldowns[command.name];
            }, command.globalCooldown * 1000)
        }
    if (command.cooldown != 0 && !hasSkipCooldownPerms)
        if (typeof globalCommands.cooldowns[interaction.user.id] != "undefined" && typeof globalCommands.cooldowns[interaction.user.id][command.name] != "undefined") {
            return utils.cooldownCommand(interaction, guild, cooldownPerm, true, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1, (guild.configurationManager.configuration.behaviour.deleteMessageOnCooldown) ? 5000 : -1);
        } else {
            if (typeof globalCommands.cooldowns[interaction.user.id] == "undefined") globalCommands.cooldowns[interaction.user.id] = {};
            globalCommands.cooldowns[interaction.user.id][command.name] = true;
            setTimeout(() => {
                delete globalCommands.cooldowns[interaction.user.id][command.name];
            }, command.globalCooldown * 1000)
        }


    MainLog.log(`${interaction.author.user.tag}(${interaction.user.id}) executed '${cmd}' in [${interaction.channelId}@${interaction.guildId}].`);
    let commandResult;
    if (typeof errorCatching == "boolean" && !errorCatching) commandResult = await command.exec(client, interaction, args, guild);
    try {
        if (typeof errorCatching == "boolean" && errorCatching) commandResult = await command.exec(client, interaction, args, guild);
        if (typeof commandResult != "undefined") {
            if (typeof commandResult == "object")
                if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logCommandExecutions)
                    if (typeof commandResult.dontLog == "undefined" || commandResult.dontLog == false)
                        if (guild.logToChannel.initialized == true && cmd != "say" && cmd != "pleasesaythat")
                            if (!guild.configurationManager.configuration.behaviour.logToChannel.embed) {
                                guild.channelLog(`<@${interaction.user.id}>(${interaction.user.id}) executed \`${cmd}\` in <#${interaction.channelId}>(${interaction.channelId}).`);
                            } else {
                                guild.channelEmbedLog(`Command execution`, `${interaction.content}`, guild.configurationManager.configuration.colors.main, [
                                    [`Executor:`, `<@${interaction.user.id}>`, true],
                                    [`Channel:`, `<#${interaction.channelId}>`, true],
                                    [`**Infos**`, `ID: ${interaction.user.id} • <t:${moment().unix()}:F>`, false]
                                ]);
                            }

            if (typeof commandResult == "function") commandResult();
        }
        if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logCommandExecutions)
            if (guild.logToChannel.initialized && cmd != "say" && cmd != "pleasesaythat")
                if (!guild.configurationManager.configuration.behaviour.logToChannel.embed) {
                    guild.channelLog(`<@${interaction.user.id}>(${interaction.user.id}) executed \`${cmd}\` in <#${interaction.channelId}>(${interaction.channelId}).`);
                } else {
                    guild.channelEmbedLog(`Command execution`, `${interaction.content}`, guild.configurationManager.configuration.colors.main, [
                        [`Executor:`, `<@${interaction.user.id}>`, true],
                        [`Channel:`, `<#${interaction.channelId}>`, true],
                        [`**Infos**`, `ID: ${interaction.user.id} • <t:${moment().unix()}:F>`, false]
                    ]);
                }
        return true;
    } catch (e) {
        return utils.sendError(interaction, guild, undefined, `An error occured within the command code.`, [], true, 5000, 5000);
    }
}