const {
    MessageEmbed
} = require(`discord.js`);

const {
    client,
    configuration,
    MainLog,
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);

//Classes Import
const Logger = require(`../classes/Logger`);

module.exports = {
    name: "autokick",
    description: `A tool to kick all members withing a certain scope.`,
    subcommands: {
        addrole: {
            description: "Add a role to the AutoKick",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        removerole: {
            description: "Remove a role from the AutoKick",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        addtoblacklist: {
            description: "Add a role to the AutoKick blacklist",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        addfromblacklist: {
            description: "Add a role from the AutoKick blacklist",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        logkickedusers: {
            description: "Enable or disable the logging of kicked users in the logging channel",
            type: "String",
            args: [{description:"Guild role", placeholder:["true","false"],type:"Boolean",optionnal:false}]
        },
        prepare: {
            description: "Fetch the users before triggering the command",
            type: "String",
            args: []
        },
        trigger: {
            description: "Trigger the AutoKick",
            type: "String",
            args: [{description:"Trigger option", placeholder:["testrun","nuke"],type:"String",optionnal:true}]
        },
        clear: {
            description: "Clear the prepared AutoKick",
            type: "String",
            aliases: ["clearpending"],
            args: []
        },
        fixroles: {
            description: "Deleted glitched roles from the roles lists (#deleted-role)",
            type: "String",
            args: []
        },
    },
    aliases: ["ak"],
    permission: `commands.autokick`,
    nestedPermissions: {
        use: "commands.autokick.use",
        manageroles: "commands.autokick.manageroles",
        settings: "commands.autokick.settings"
    },
    category: `administration`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let cmd = message.content.replace(args.join(' '), '');

        if (args.length == 0) {
            let embed = new MessageEmbed({
                title: `${configuration.appName}'s AutoKick settings`,
                color: guild.configuration.colors.main,
                description: `Kick players within a certain role.\n**Commands to manage the AutoKick :**`
            });

            //embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick status <true/false>\` : *Enable or disable AutoKick*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick addRole <@Role>\` : *Add a role to the AutoKick*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick removeRole <@Role>\` : *Remove a role from the AutoKick*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick addToBlacklist <@Role>\` : *Add role to the blacklist (Skip members within this list)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick removeFromBlacklist <@Role>\` : *Remove role from the blacklist*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick logKickedUsers <true/false>\` : *Should the kicked users be logged in the logging channel ?*`
            //embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick reason <reason>\` : *What reason should be used for the kick ?*`
            //embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick reasonHelp\` : *Show some help on how to configure the reason*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick prepare\` : *Prepare the AutoKick (Fetches users, add them to queue and wait for the trigger)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick trigger <testrun/nuke>\` : *Trigger the kick spread, kick all users in the AutoKick queue*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick clear/clearpending\` : *Clear the current queue*`
            embed.description += `\n\`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick fixroles\` : *Clear the deleted roles from the role list*`

            if (typeof guild.configuration.autokick.rolesToKick != "object") guild.configuration.autokick.rolesToKick = [];
            guild.configurationManager.save();

            /*embed.addField(`Current status:`, (guild.configuration.autokick.status) ? `Enabled` : `Disabled`, true);
            embed.addField(`Trigger:`, (guild.configuration.autokick.trigger == "cron") ? `Automatic with cron task` : (guild.configuration.autokick.trigger == "interval") ? `Automatic with javascript interval` : (guild.configuration.autokick.trigger == "message") ? `Automatic check every x messages in the guild` : `Manual only`, true);*/
            embed.addField(`**Log Kicked Users :**`, (guild.configuration.autokick.logKickedUsers) ? `Enabled` : `Disabled`, false);
            embed.addField(`**Kick reason:**`, `${guild.configuration.autokick.kickReason}`, false);
            embed.addField(`**Current kickable roles:**`, (guild.configuration.autokick.rolesToKick.length == 0) ? `None, equals to @everyone` : `<@&${guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>`, false);
            embed.addField(`**Current blacklisted roles:**`, (guild.configuration.autokick.blacklist.length == 0) ? `None` : `<@&${guild.configuration.autokick.blacklist.join(`>, <@&`)}>`, false);
            let autoKickTriggered = [];
            if (typeof guild.autokick != "undefined" && typeof guild.autokick.triggered != "undefined")
                for (const key in guild.autokick.triggered) {
                    autoKickTriggered.push(key)
                }
            if (typeof guild.autokick != "undefined") embed.addField(`AutoKick pending :`, `Users waiting for their kick : \`${Object.keys(guild.autokick.queue).length}\`
                                                                                            Triggers needed : \`${guild.autokick.triggersLeft}\`
                                                                                            ${(autoKickTriggered.length != 0) ? `Already triggered : <@${autoKickTriggered.join(`>, <@`)}>` : `None`}`, false);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0].toLowerCase() == "status" && false) {
            let permissionToCheck = this.nestedPermissions.settings;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (args.length != 2) {
                let embed = new MessageEmbed({
                    title: `${configuration.appName}'s AutoKick Status`,
                    color: guild.configuration.colors.main,
                    description: `***This has no usage yet, to trigger an autokick use *** \`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick trigger\``
                });
                message.reply({
                    embeds: [embed],
                    failIfNotExists: false
                }, false).then(msg => {
                    if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                }).catch(e => utils.messageReplyFailLogger(message, guild, e));
                return true;
            }
            let statusValue = (args[1] == '1' || args[1] == "true" || args[1] == "yes") ? true : false;
            guild.configuration.autokick.status = statusValue;
            guild.configurationManager.save();
            let embed = new MessageEmbed({
                title: `AutoKick status set`,
                color: guild.configuration.colors.main
            });
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0].toLowerCase() == "logkickedusers") {
            let permissionToCheck = this.nestedPermissions.settings;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (args.length == 1) return utils.sendMain(message, guild, `AutoKick Helper`, `Usage: \`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick logKickedUsers <true/false>\``);

            let statusValue = (args[1] == '1' || args[1] == "true" || args[1] == "yes") ? true : false;
            guild.configuration.autokick.logKickedUsers = statusValue;
            guild.configurationManager.save();

            return utils.sendMain(message, guild, `AutoKick Logging ${(statusValue) ? `Enabled` : `Disabled`} `);
        }

        if (args[0].toLowerCase() == "addrole") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `AutoKick Error`, `You must mention at least one role to add.`);

            let rolesToAdd = message.mentions.roles;

            rolesToAdd.forEach(roleToAdd => {
                if (typeof guild.configuration.autokick.rolesToKick == "undefined") guild.configuration.autokick.rolesToKick = [];
                if (!guild.configuration.autokick.rolesToKick.includes(roleToAdd.id)) guild.configuration.autokick.rolesToKick.push(roleToAdd.id);
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `AutoKick role(s) added`, `Current roles in scope : ${(guild.configuration.autokick.rolesToKick.length == 0) ? `none` : `<@&${(guild.configuration.autokick.rolesToKick.length == 1) ? guild.configuration.autokick.rolesToKick : guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>` }`);
        }

        if (args[0].toLowerCase() == "removerole") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `AutoKick Error`, `You must mention at least one role to remove.`);

            let rolesToRemove = message.mentions.roles;

            rolesToRemove.forEach(roleToRemove => {
                if (guild.configuration.autokick.rolesToKick.includes(roleToRemove.id));
                guild.configuration.autokick.rolesToKick = guild.configuration.autokick.rolesToKick.filter(function (e) {
                    return e !== roleToRemove.id
                })
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `AutoKick role(s) removed`, `Current roles in scope : ${(guild.configuration.autokick.rolesToKick.length == 0) ? `none` : `<@&${(guild.configuration.autokick.rolesToKick.length == 1) ? guild.configuration.autokick.rolesToKick : guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>` }`);
        }

        if (args[0].toLowerCase() == "addtoblacklist") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to add.`);

            let blacklist = message.mentions.roles;

            blacklist.forEach(rolesToAdd => {
                if (typeof guild.configuration.autokick.blacklist == "undefined") guild.configuration.autokick.blacklist = [];
                if (!guild.configuration.autokick.blacklist.includes(rolesToAdd.id)) guild.configuration.autokick.blacklist.push(rolesToAdd.id);
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) added`, `Blacklisted role(s) are now <@&${(guild.configuration.autokick.blacklist.length == 1) ? guild.configuration.autokick.blacklist : guild.configuration.autokick.blacklist.join(`>, <@&`)}>.`);
        }

        if (args[0].toLowerCase() == "removefromblacklist") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to remove.`);

            let rolesToRemove = message.mentions.roles;

            rolesToRemove.forEach(roleToRemove => {
                if (guild.configuration.autokick.blacklist.includes(roleToRemove.id));
                guild.configuration.autokick.blacklist = guild.configuration.autokick.blacklist.filter(function (e) {
                    return e !== roleToRemove.id
                })
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) removed`, `Blacklisted role(s) are now <@&${(guild.configuration.autokick.blacklist.length == 1) ? guild.configuration.autokick.blacklist : guild.configuration.autokick.blacklist.join(`>, <@&`)}>.`);
        }

        if (args[0].toLowerCase() == "fixroles") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (guild.configuration.autokick.rolesToKick.length == 0) return utils.sendError(message, guild, `AutoKick Error`, `No roles in scope, made it easy to fix. (the joke here is that I had nothing to do haha)`);

            let rolesLeft = guild.configuration.autokick.rolesToKick.length;

            guild.configuration.autokick.rolesToKick.forEach(roleToCheck => {
                client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                    fetchedGuild.roles.fetch(roleToCheck).then(fetchedRole => {
                        if (typeof fetchedRole == "undefined" || fetchedRole == null) {
                            guild.configuration.autokick.rolesToKick = guild.configuration.autokick.rolesToKick.filter(arrayItem => arrayItem !== roleToCheck);
                        }
                    }).catch(e => {
                        guild.configuration.autokick.rolesToKick = guild.configuration.autokick.rolesToKick.filter(arrayItem => arrayItem !== roleToCheck);
                    });
                }).catch(e => utils.catchCustomLog(message, guild, e, `Could not fetch guild`));
                rolesLeft--;
                if (rolesLeft == 0) {
                    guild.configurationManager.save();
                    return utils.sendMain(message, guild, `AutoKick roles fixed`, undefined);
                }
            });
        }

        if (args[0].toLowerCase() == "prepare") {
            let permissionToCheck = this.nestedPermissions.use;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            let rolesToKick = guild.configuration.autokick.rolesToKick;

            //if (rolesToKick.length == 0) return utils.sendError(message, guild, `AutoKick Error`, `No roles in scope.`);

            guild.autokick = {
                queue: {},
                triggersLeft: guild.configuration.autokick.triggerNeeded,
                ready: false,
                triggered: {}
            };
            let rolesLeft = (rolesToKick.length == 0) ? 2147483647 : rolesToKick.length;

            let embed = new MessageEmbed({
                title: `Preparing Auto Kick`,
                color: (typeof guild == "undefined") ? configuration.colors.error : guild.configuration.colors.main
            });
            embed.addField(`**Role(s) to kick :**`, (guild.configuration.autokick.rolesToKick.length == 0) ? `None, equals to @everyone` : `<@&${guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>`, true);
            embed.addField(`**Blacklisted roles:**`, (guild.configuration.autokick.blacklist.length == 0) ? `None` : `<@&${guild.configuration.autokick.blacklist.join(`>, <@&`)}>`, false);
            embed.addField(`**Status :**`, `Fetching users`, true);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                    MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                })

                let updateInterval = setInterval(() => {
                    if (rolesLeft == 0) {
                        if (typeof guild.autokick == "undefined" || Object.keys(guild.autokick.queue).length == 0) {
                            embed.fields = [];
                            embed.description = `No users to kick, auto cancelled.`;
                            embed.addField(`**Role(s) to kick :**`, (guild.configuration.autokick.rolesToKick.length == 0) ? `None, equals to @everyone` : `<@&${guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>`, true);
                            embed.addField(`**Blacklisted roles:**`, (guild.configuration.autokick.blacklist.length == 0) ? `None` : `<@&${guild.configuration.autokick.blacklist.join(`>, <@&`)}>`, false);
                            embed.addField(`**Status :**`, `Cancelled`, true);
                            msg.edit({
                                embeds: [embed],
                                failIfNotExists: false
                            }).catch(e => {});
                            delete guild.autokick;
                            return;
                        }
                        embed.fields = [];
                        embed.description = `Run \`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick trigger\` to trigger the AutoKick`;
                        embed.addField(`**Role(s) to kick :**`, (guild.configuration.autokick.rolesToKick.length == 0) ? `None, equals to @everyone` : `<@&${guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>`, true);
                        embed.addField(`**Blacklisted roles:**`, (guild.configuration.autokick.blacklist.length == 0) ? `None` : `<@&${guild.configuration.autokick.blacklist.join(`>, <@&`)}>`, false);
                        embed.addField(`**Status :**`, `Waiting for trigger`, true);
                        embed.addField(`**Users fetched :**`, `${(guild.autokick) ? Object.keys(guild.autokick.queue).length : `Error`}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                        clearInterval(updateInterval);
                    } else {
                        if (typeof guild.autokick == "undefined")clearInterval(updateInterval);
                        embed.fields = [];
                        embed.addField(`**Role(s) to kick :**`, (guild.configuration.autokick.rolesToKick.length == 0) ? `None, equals to @everyone` : `<@&${guild.configuration.autokick.rolesToKick.join(`>, <@&`)}>`, true);
                        embed.addField(`**Blacklisted roles:**`, (guild.configuration.autokick.blacklist.length == 0) ? `None` : `<@&${guild.configuration.autokick.blacklist.join(`>, <@&`)}>`, false);
                        embed.addField(`**Status :**`, `Fetching users`, true);
                        embed.addField(`**Users fetched :**`, `${(typeof guild.autokick == "undefined") ? `Error` : Object.keys(guild.autokick.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                    }
                }, 1250);


            }).catch(e => utils.messageReplyFailLogger(message, guild, e));

            if (rolesLeft != 2147483647)client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                rolesToKick.forEach(indRole => {
                    fetchedGuild.roles.fetch(indRole).then(fetchedRole => {
                        let membersLeft = (typeof fetchedRole != "undefined" && fetchedRole != null) ? fetchedRole.members.size : 0;
                        if (typeof fetchedRole == "undefined" || fetchedRole == null) {
                            rolesLeft--;
                            if (rolesLeft == 0) {
                                guild.autokick.ready = true;
                                return;
                            }
                        }
                        fetchedRole.members.forEach(indMember => {
                            let memberHasBlacklistedRole = (guild.configuration.autokick.blacklist.length != 0) ? indMember.roles.cache.some(indRole => guild.configuration.autokick.blacklist.includes(indRole.id)) : false;
                            if (!memberHasBlacklistedRole)guild.autokick.queue[indMember.id] = indMember;
                            membersLeft--;
                            if (membersLeft == 0) {
                                rolesLeft--;
                                if (rolesLeft == 0) {
                                    guild.autokick.ready = true;
                                }
                            }
                        });
                    }).catch(e => {
                        console.log(e);
                    });
                });
            }).catch(e => utils.catchCustomLog(message, guild, e, `Could not fetch users`));
            if (rolesLeft == 2147483647)client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                fetchedGuild.members.fetch().then(guildMembers => {
                    let membersLeft = (typeof guildMembers != "undefined" && guildMembers != null) ? guildMembers.size : 0;
                    guildMembers.forEach(indMember => {
                        let memberHasBlacklistedRole = (guild.configuration.autokick.blacklist.length != 0) ? indMember.roles.cache.some(indRole => guild.configuration.autokick.blacklist.includes(indRole.id)) : false;
                        if (!memberHasBlacklistedRole)guild.autokick.queue[indMember.id] = indMember;
                        membersLeft--;
                        if (membersLeft == 0) {
                            rolesLeft == 0;
                            guild.autokick.ready = true;
                        }
                    });
                }).catch(e => {
                    console.log(e);
                });
            }).catch(e => utils.catchCustomLog(message, guild, e, `Could not fetch users`));
            return true;
        }

        if (args[0].toLowerCase() == "trigger") {
            let permissionToCheck = this.nestedPermissions.use;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (typeof guild.autokick == "undefined") return utils.sendError(message, guild, `AutoKick Error`, `Nothing pending, run \`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick prepare\` to trigger the fetching.`);

            if (guild.autokick.ready == false) return utils.sendError(message, guild, `AutoKick Error`, `Fetching is still running.`);

            if (typeof guild.autokick.triggered[message.author.id] != "undefined") return utils.sendError(message, guild, `AutoKick Error`, `You already triggered.`);

            let embed = new MessageEmbed({
                title: `${configuration.appName}'s AutoKick Triggerd`,
                color: guild.configuration.colors.main
            });

            let total = Object.keys(guild.autokick.queue).length;
            guild.autokick.triggersLeft--;
            guild.autokick.triggered[message.author.id] = true;

            embed.addField(`**Users scoped :**`, `${Object.keys(guild.autokick.queue).length}`, true);
            embed.addField(`**Triggers needed to start :**`, `${(guild.autokick.triggersLeft == 0) ? `None` : guild.autokick.triggersLeft}`, true);
            embed.addField(`**Users left to kick :**`, `${Object.keys(guild.autokick.queue).length}`, true);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));

                let updateInterval = setInterval(() => {
                    if (typeof guild.autokick.queue == "undefined" || Object.keys(guild.autokick.queue).length == 0) {
                        embed.fields = [];
                        embed.description = `Kicked ${total} user`;
                        embed.addField(`**Users scoped :**`, `${total}`, true);
                        embed.addField(`**Triggers needed to start :**`, `${(guild.autokick.triggersLeft == 0) ? `None` : guild.autokick.triggersLeft}`, true);
                        embed.addField(`**Users left to kick :**`, `${Object.keys(guild.autokick.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                        delete guild.autokick;
                        clearInterval(updateInterval);
                    } else {
                        embed.fields = [];
                        embed.addField(`**Users scoped :**`, `${Object.keys(guild.autokick.queue).length}`, true);
                        embed.addField(`**Triggers needed to start :**`, `${(guild.autokick.triggersLeft == 0) ? `None` : guild.autokick.triggersLeft}`, true);
                        embed.addField(`**Users left to kick :**`, `${Object.keys(guild.autokick.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => utils.catchCustomLog(message, guild, e, `Could not edit message`));
                    }
                }, (total > 500) ? 10000 : 2000);
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));

            if (guild.autokick.triggersLeft != 0) return true;

            const kickLog = new Logger(`./logs/guilds/${message.channel.guild.id}/kickLog.txt`);

            if ((guild.configuration.autokick.logKickedUsers && guild.logToChannel.initialized) && (typeof args[1] == "string" && args[1].toLowerCase() == "nuke")) {
                guild.logToChannel.channel.send(`https://tenor.com/view/explosion-mushroom-cloud-atomic-bomb-bomb-boom-gif-4464831`)
            }

            for (const key in guild.autokick.queue) {
                if (typeof args[1] == "string" && (args[1].toLocaleLowerCase() == "testrun" || args[1].toLocaleLowerCase() == "jk" || args[1].toLocaleLowerCase() == "fake")) {
                    MainLog.log(`Kicked ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id}) [Test run, user not kicked]`);
                    if (guild.configuration.autokick.logKickedUsers && guild.logToChannel.initialized) guild.channelLog(`Kicked ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id}) [Test run, user not kicked]`);
                    delete guild.autokick.queue[key];
                } else {
                    guild.autokick.queue[key].kick(`${kickReasonPlaceholder(guild.configuration.autokick.kickReason, message.author, `Manual Trigger`)}`).then(() => {
                        kickLog.log(`Kicked ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id})`)
                        MainLog.log(`Kicked ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id})`);
                        if (guild.configuration.autokick.logKickedUsers && guild.logToChannel.initialized) guild.channelLog(`Kicked ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id})`);
                        delete guild.autokick.queue[key];
                    }).catch(e => {
                        MainLog.log(`Could not kick ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) [${e.toString()}]`);
                        if (guild.configuration.autokick.logKickedUsers && guild.logToChannel.initialized) guild.channelLog(`Could not kick ${guild.autokick.queue[key].user.username}#${guild.autokick.queue[key].user.discriminator}(${guild.autokick.queue[key].user.id}) [${e.toString()}]`);
                        delete guild.autokick.queue[key];
                    });
                }
            }
            return true;
        }

        if (["clearpending", "clear", "cancel"].includes(args[0].toLowerCase())) {
            let permissionToCheck = this.nestedPermissions.use;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to execute '${cmd}' in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to execute \`${cmd}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);

            if (typeof guild.autokick == "undefined") return utils.sendError(message, guild, `AutoKick Error`, `Nothing to clear, run \`${(typeof guild == "undefined") ? configuration.prefix : guild.configuration.prefix}autokick prepare\` to trigger the fetching.`);

            if (typeof guild.autokick != "undefined") delete guild.autokick;
            return utils.sendMain(message, guild, `AutoKick pending cleared`);
        }

        if (args[0].toLowerCase() == "reasonhelp" && false) {
            let embed = new MessageEmbed({
                title: `${configuration.appName}'s AutoKick Reason Helper`,
                color: guild.configuration.colors.main,
                description: `**Here is some help to configure the kick reason :**
                                *You can use any of the placeholders shown below.*
                            Current reason :
                            Value: \`${guild.configuration.autokick.kickReason}\`
                            Display: \`${kickReasonPlaceholder(guild.configuration.autokick.kickReason, message.author, `Manual Trigger`)}\``
            });

            embed.addField(`&{AppName}`, `Shows the bot app name.\n\`${configuration.appName}\``, true);
            embed.addField(`&{TriggerUserID}`, `Shows the trigger user ID.\n\`${message.author.id}\``, true);
            embed.addField(`&{TriggerUserTag}`, `Shows the trigger user tag.\n\`${message.author.username}#${message.author.discriminator}\``, true);
            embed.addField(`&{TriggerReason}`, `Shows the trigger reason.\n\`Manual Trigger\``, true);
            embed.addField(`&{BotTag}`, `Shows the bots tag.\n\`${client.user.tag}\``, true);
            embed.addField(`More infos :`, `Any user related placeholders such as \`TriggerUserID\` and \`TriggerUserTag\` will show [AUTOMATIC] if its not a manual trigger.`, false);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
    }
}

function kickReasonPlaceholder(reason, TriggerUser, TriggerReason) {
    let newReason = reason;
    newReason = newReason.replace('&{AppName}', `${configuration.appName}`);
    newReason = newReason.replace('&{TriggerUserID}', `${TriggerUser.id}`);
    newReason = newReason.replace('&{TriggerUserTag}', `${TriggerUser.username}#${TriggerUser.discriminator}`);
    newReason = newReason.replace('&{TriggerReason}', `${TriggerReason}`);
    newReason = newReason.replace('&{BotTag}', `${client.user.tag}`);
    return newReason;
}