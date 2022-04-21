const {
    MessageEmbed
} = require(`discord.js`);
const {
    forIn
} = require("lodash");

const {
    client,
    globalConfiguration,
    MainLog,
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);

//Classes Import
const Logger = require(`../classes/Logger`);

module.exports = {
    name: "roleadder",
    description: `A tool to add roles to members with a certain scope`,
    subcommands: {
        addrole: {
            description: "Add a role to the RoleAdded",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        removerole: {
            description: "Remove a role from the RoleAdded",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        addtoblacklist: {
            description: "Add a role to the RoleAdded blacklist",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        addfromblacklist: {
            description: "Add a role from the RoleAdded blacklist",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        addtowhitelist: {
            description: "Add a role to the RoleAdded whitelist",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        addfromwhitelist: {
            description: "Add a role from the RoleAdded whitelist",
            type: "String",
            args: [{description:"Guild role", placeholder:["@Role"],type:"String",optionnal:false}]
        },
        logkickedusers: {
            description: "Enable or disable the logging of added roles users in the logging channel",
            type: "String",
            args: [{description:"Guild role", placeholder:["true","false"],type:"Boolean",optionnal:false}]
        },
        prepare: {
            description: "Fetch the users before triggering the command",
            type: "String",
            args: []
        },
        trigger: {
            description: "Trigger the RoleAdded",
            type: "String",
            args: [{description:"Trigger option", placeholder:["testrun","nuke"],type:"String",optionnal:true}]
        },
        clear: {
            description: "Clear the prepared RoleAdded",
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
    aliases: ["ra"],
    permission: `commands.roleadder`,
    nestedPermissions: {
        use: "commands.roleadder.use",
        manageroles: "commands.roleadder.manageroles",
        settings: "commands.roleadder.settings"
    },
    category: `administration`,
    async exec(client, message, args, guild = undefined) {

        if (args.length == 0) {
            let embed = new MessageEmbed({
                title: `[${globalConfiguration.configuration.appName}] - Role Adder`,
                color: guild.configurationManager.configuration.colors.main,
                description: `Add roles to all members that doent already have it. Can filter with a blacklist.`
            });

            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder addRole <@Role>\` : *Add role to the list of role(s) to be added*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder removeRole <@Role>\` : *Remove role to the list of role(s) to be added*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder addToBlacklist <@Role>\` : *Add role to the blacklist (Skip members within this list)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder removeFromBlacklist <@Role>\` : *Remove role from the blacklist*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder addToWhitelist <@Role>\` : *Add role to the whitelist (Skip members that are not within this list)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder removeFromWhitelist <@Role>\` : *Remove role from the whitelist*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder logAddedUsers <true/false>\` : *Should the added users be logged in the logging channel ?*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder prepare\` : *Prepare the role adding process (Fetches users, add them to queue and wait for the trigger)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder trigger <testrun>\` : *Trigger the role adding process (Add roles to members)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder clear/clearpending\` : *Clear the current queue (Cancel prepare)*`
            embed.description += `\n\`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder fixroles\` : *Clear the deleted roles from the role lists*`

            if (typeof guild.configurationManager.configuration.roleadder.rolesToAdd != "object") guild.configurationManager.configuration.roleadder.rolesToAdd = [];
            if (typeof guild.configurationManager.configuration.roleadder.blacklist != "object") guild.configurationManager.configuration.roleadder.blacklist = [];
            guild.configurationManager.save();

            embed.addField(`**Log Added Users :**`, (guild.configurationManager.configuration.roleadder.logAddedUsers) ? `Enabled` : `Disabled`, false);
            embed.addField(`**Add reason:**`, `${guild.configurationManager.configuration.roleadder.addReason}`, false);
            embed.addField(`**Current roles to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, false);
            embed.addField(`**Current blacklisted roles:**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, false);
            embed.addField(`**Current whitelisted roles:**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, false);

            if (typeof guild.roleadder != "undefined") embed.addField(`roleadder pending :`, `Users waiting for their role(s) : \`${Object.keys(guild.roleadder.queue).length}\``, false);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0].toLowerCase() == "logaddedusers") {
            let permissionToCheck = this.nestedPermissions.settings;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length == 1) return utils.sendError(message, guild, `Error`, `Usage: \`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder logAddedUsers <true/false>\``, [], true); /*Updated To New Utils*/
            let statusValue = (args[1] == '1' || args[1] == "true" || args[1] == "yes") ? true : false;
            guild.configurationManager.configuration.roleadder.logAddedUsers = statusValue;
            return utils.sendMain(message, guild, `RoleAdder logging ${(statusValue) ? `Enabled` : `Disabled`}`, undefined, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "addrole") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to add.`, [], true); /*Updated To New Utils*/

            let rolesToAdd = message.mentions.roles;

            rolesToAdd.forEach(rolesToAdd => {
                if (typeof guild.configurationManager.configuration.roleadder.rolesToAdd == "undefined") guild.configurationManager.configuration.roleadder.rolesToAdd = [];
                if (!guild.configurationManager.configuration.roleadder.rolesToAdd.includes(rolesToAdd.id)) guild.configurationManager.configuration.roleadder.rolesToAdd.push(rolesToAdd.id);
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) added`, `Role(s) to add are now <@&${(guild.configurationManager.configuration.roleadder.rolesToAdd.length == 1) ? guild.configurationManager.configuration.roleadder.rolesToAdd : guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>.`, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "removerole") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to remove.`, [], true); /*Updated To New Utils*/

            let rolesToRemove = message.mentions.roles;

            rolesToRemove.forEach(roleToRemove => {
                if (guild.configurationManager.configuration.roleadder.rolesToAdd.includes(roleToRemove.id));
                guild.configurationManager.configuration.roleadder.rolesToAdd = guild.configurationManager.configuration.roleadder.rolesToAdd.filter(function (e) {
                    return e !== roleToRemove.id
                })
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) removed`, `Role(s) to add are now <@&${(guild.configurationManager.configuration.roleadder.rolesToAdd.length == 1) ? guild.configurationManager.configuration.roleadder.rolesToAdd : guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>.`, [], true);/*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "addtoblacklist") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to add.`, [], true); /*Updated To New Utils*/

            let blacklist = message.mentions.roles;

            blacklist.forEach(rolesToAdd => {
                if (typeof guild.configurationManager.configuration.roleadder.blacklist == "undefined") guild.configurationManager.configuration.roleadder.blacklist = [];
                if (!guild.configurationManager.configuration.roleadder.blacklist.includes(rolesToAdd.id)) guild.configurationManager.configuration.roleadder.blacklist.push(rolesToAdd.id);
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) added`, `Blacklisted role(s) are now <@&${(guild.configurationManager.configuration.roleadder.blacklist.length == 1) ? guild.configurationManager.configuration.roleadder.blacklist : guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>.`, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "removefromblacklist") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to remove.`, [], true); /*Updated To New Utils*/

            let rolesToRemove = message.mentions.roles;

            rolesToRemove.forEach(roleToRemove => {
                if (guild.configurationManager.configuration.roleadder.blacklist.includes(roleToRemove.id));
                guild.configurationManager.configuration.roleadder.blacklist = guild.configurationManager.configuration.roleadder.blacklist.filter(function (e) {
                    return e !== roleToRemove.id
                })
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) removed`, `Blacklisted role(s) are now <@&${(guild.configurationManager.configuration.roleadder.blacklist.length == 1) ? guild.configurationManager.configuration.roleadder.blacklist : guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>.`, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "addtowhitelist") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to add.`, [], true); /*Updated To New Utils*/

            let whitelist = message.mentions.roles;

            whitelist.forEach(rolesToAdd => {
                if (typeof guild.configurationManager.configuration.roleadder.whitelist == "undefined") guild.configurationManager.configuration.roleadder.whitelist = [];
                if (!guild.configurationManager.configuration.roleadder.whitelist.includes(rolesToAdd.id)) guild.configurationManager.configuration.roleadder.whitelist.push(rolesToAdd.id);
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) added`, `Whitelisted role(s) are now <@&${(guild.configurationManager.configuration.roleadder.whitelist.length == 1) ? guild.configurationManager.configuration.roleadder.whitelist : guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>.`, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "removefromwhitelist") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (args.length < 2 || message.mentions.roles.size == 0) return utils.sendError(message, guild, `Error`, `You must specify at least one role to remove.`, [], true); /*Updated To New Utils*/

            let rolesToRemove = message.mentions.roles;

            rolesToRemove.forEach(roleToRemove => {
                if (guild.configurationManager.configuration.roleadder.whitelist.includes(roleToRemove.id));
                guild.configurationManager.configuration.roleadder.whitelist = guild.configurationManager.configuration.roleadder.whitelist.filter(function (e) {
                    return e !== roleToRemove.id
                })
            });

            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Role(s) removed`, `Whitelisted role(s) are now <@&${(guild.configurationManager.configuration.roleadder.whitelist.length == 1) ? guild.configurationManager.configuration.roleadder.whitelist : guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>.`, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "fixroles") {
            let permissionToCheck = this.nestedPermissions.manageroles;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (guild.configurationManager.configuration.roleadder.blacklist.length == 0) return utils.sendError(message, guild, `No roles defined, i wont have to fix anything`, undefined, [], true); /*Updated To New Utils*/


            let roleCheckerPromise_Add = new Promise((res, rej) => {
                let rolesLeft = guild.configurationManager.configuration.roleadder.rolesToAdd.length;
                if (rolesLeft == 0) res(true);
                guild.configurationManager.configuration.roleadder.rolesToAdd.forEach(roleToCheck => {
                    client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                        fetchedGuild.roles.fetch(roleToCheck).then(fetchedRole => {
                            if (typeof fetchedRole == "undefined" || fetchedRole == null) {
                                guild.configurationManager.configuration.roleadder.rolesToAdd = guild.configurationManager.configuration.roleadder.rolesToAdd.filter(arrayItem => arrayItem !== roleToCheck);
                            }
                        }).catch(e => {
                            guild.configurationManager.configuration.roleadder.rolesToAdd = guild.configurationManager.configuration.roleadder.rolesToAdd.filter(arrayItem => arrayItem !== roleToCheck);
                        });
                    }).catch(e => {
                        console.log(`Could not fetch guild.. roleadder.js@194`);
                    });
                    rolesLeft--;
                    if (rolesLeft == 0) res(true);
                });
            });
            let roleCheckerPromise_BlackList = new Promise((res, rej) => {
                let rolesLeft = guild.configurationManager.configuration.roleadder.blacklist.length;
                if (rolesLeft == 0) res(true);
                guild.configurationManager.configuration.roleadder.blacklist.forEach(roleToCheck => {
                    client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                        fetchedGuild.roles.fetch(roleToCheck).then(fetchedRole => {
                            if (typeof fetchedRole == "undefined" || fetchedRole == null) {
                                guild.configurationManager.configuration.roleadder.blacklist = guild.configurationManager.configuration.roleadder.blacklist.filter(arrayItem => arrayItem !== roleToCheck);
                            }
                        }).catch(e => {
                            guild.configurationManager.configuration.roleadder.blacklist = guild.configurationManager.configuration.roleadder.blacklist.filter(arrayItem => arrayItem !== roleToCheck);
                        });
                    }).catch(e => {
                        console.log(`Could not fetch guild.. roleadder.js@194`);
                    });
                    rolesLeft--;
                    if (rolesLeft == 0) res(true);
                });
            });
            let roleCheckerPromise_WhiteList = new Promise((res, rej) => {
                let rolesLeft = guild.configurationManager.configuration.roleadder.whitelist.length;
                if (rolesLeft == 0) res(true);
                guild.configurationManager.configuration.roleadder.whitelist.forEach(roleToCheck => {
                    client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                        fetchedGuild.roles.fetch(roleToCheck).then(fetchedRole => {
                            if (typeof fetchedRole == "undefined" || fetchedRole == null) {
                                guild.configurationManager.configuration.roleadder.whitelist = guild.configurationManager.configuration.roleadder.whitelist.filter(arrayItem => arrayItem !== roleToCheck);
                            }
                        }).catch(e => {
                            guild.configurationManager.configuration.roleadder.whitelist = guild.configurationManager.configuration.roleadder.whitelist.filter(arrayItem => arrayItem !== roleToCheck);
                        });
                    }).catch(e => {
                        console.log(`Could not fetch guild.. roleadder.js@194`);
                    });
                    rolesLeft--;
                    if (rolesLeft == 0) res(true);
                });
            });
            await roleCheckerPromise_Add;
            await roleCheckerPromise_BlackList;
            await roleCheckerPromise_WhiteList;
            guild.configurationManager.save();
            return utils.sendMain(message, guild, `Roles fixed`, undefined, [], true); /*Updated To New Utils*/
        }

        if (["prepare", "fetch"].includes(args[0].toLowerCase())) {
            let permissionToCheck = this.nestedPermissions.use;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            
            let rolesToAdd = guild.configurationManager.configuration.roleadder.rolesToAdd;

            if (rolesToAdd.length == 0) return utils.sendError(message, guild, `Error`, `No roles defined in the add list.`, [], true); /*Updated To New Utils*/

            let usersToCheck = 1;

            guild.roleadder = {
                queue: {},
                ready: false,
                triggered: {},
                status: `Fetching server members`
            };

            let embed = new MessageEmbed({
                title: `[${globalConfiguration.configuration.appName}] - Preparing Role Adder`,
                color: (typeof guild == "undefined") ? globalConfiguration.configuration.colors.error : guild.configurationManager.configuration.colors.main
            });
            embed.addField(`**Role(s) to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, true);
            embed.addField(`**Role blacklist :**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, true);
            embed.addField(`**Role whitelist :**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, true);
            embed.addField(`**Status :**`, `${guild.roleadder.status}`, true);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));

                let updateInterval = setInterval(() => {
                    if (usersToCheck == 0) {
                        if (typeof guild.roleadder == "undefined" || Object.keys(guild.roleadder.queue).length == 0) {
                            embed.fields = [];
                            embed.description = `No users to add the role(s) to, auto cancelled.`;
                            embed.addField(`**Role(s) to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, true);
                            embed.addField(`**Role blacklist :**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, true);
                            embed.addField(`**Role whitelist :**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, true);
                            embed.addField(`**Status :**`, `Cancelled`, true);
                            msg.edit({
                                embeds: [embed],
                                failIfNotExists: false
                            }).catch(e => {});
                            delete guild.roleadder;
                            return;
                        }
                        embed.fields = [];
                        embed.description = `Run \`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder trigger\` to trigger the roleadder`;
                        embed.addField(`**Role(s) to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role blacklist :**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role whitelist :**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Status :**`, `Waiting for trigger`, true);
                        embed.addField(`**Users fetched :**`, `${Object.keys(guild.roleadder.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                        clearInterval(updateInterval);
                    } else {
                        embed.fields = [];
                        embed.addField(`**Role(s) to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role blacklist :**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role whitelist :**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Status :**`, `${guild.roleadder.status}`, true);
                        embed.addField(`**Users fetched :**`, `${Object.keys(guild.roleadder.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                    }
                }, 1250);

                client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                    fetchedGuild.members.fetch().then(fetchedMembers => {
                        usersToCheck = fetchedMembers.size;
                        fetchedMembers.forEach(indMember => {
                            let memberAlreadyHasRoles = guild.configurationManager.configuration.roleadder.rolesToAdd.every(indRole => {
                                return indMember.roles.cache.has(indRole);
                            })
                            let memberHasBlacklistedRole = (guild.configurationManager.configuration.roleadder.blacklist.length != 0) ? indMember.roles.cache.some(indRole => guild.configurationManager.configuration.roleadder.blacklist.includes(indRole.id)) : false;
                            let memberHasWhitelistedRole = (guild.configurationManager.configuration.roleadder.whitelist.length != 0) ? guild.configurationManager.configuration.roleadder.whitelist.every(indRole => {
                                return indMember.roles.cache.has(indRole);
                            }) : true;
                            if (!memberAlreadyHasRoles && !memberHasBlacklistedRole && memberHasWhitelistedRole) guild.roleadder.queue[indMember.id] = indMember;
                            usersToCheck--;
                            if (usersToCheck == 0) guild.roleadder.ready = true;
                        });
                    }).catch(e => {
                        MainLog.log(`Could not fetch users from guild [${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch users. Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                }).catch(e => {
                    MainLog.log(`Could not fetch guild [${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild. Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });


            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0].toLowerCase() == "trigger") {
            let permissionToCheck = this.nestedPermissions.use;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (typeof guild.roleadder == "undefined") return utils.sendError(message, guild, `Error`, `Nothing to trigger. Run \`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder prepare\` to trigger the fetching.`, [], true); /*Updated To New Utils*/


            if (guild.roleadder.ready == false) return utils.sendError(message, guild, `Error`, `Fetching is still active, wait for it to finish before triggering.`, [], true); /*Updated To New Utils*/

            let embed = new MessageEmbed({
                title: `[${globalConfiguration.configuration.appName}] - Role Adder Triggered`,
                color: guild.configurationManager.configuration.colors.main
            });

            let total = Object.keys(guild.roleadder.queue).length;

            embed.addField(`**Users scoped :**`, `${total}`, true);
            embed.addField(`**Users left to add the role to :**`, `${Object.keys(guild.roleadder.queue).length}`, true);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));

                let updateInterval = setInterval(() => {
                    if (typeof guild.roleadder.queue == "undefined" || Object.keys(guild.roleadder.queue).length == 0) {
                        embed.fields = [];
                        embed.description = `Added role(s) to ${total} user`;
                        embed.addField(`**Role(s) to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role blacklist :**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role whitelist :**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Users scoped :**`, `${total}`, true);
                        embed.addField(`**Users left to add the role to :**`, `${Object.keys(guild.roleadder.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                        delete guild.roleadder;
                        clearInterval(updateInterval);
                    } else {
                        embed.fields = [];
                        embed.addField(`**Role(s) to add :**`, (guild.configurationManager.configuration.roleadder.rolesToAdd.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role blacklist :**`, (guild.configurationManager.configuration.roleadder.blacklist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.blacklist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Role whitelist :**`, (guild.configurationManager.configuration.roleadder.whitelist.length == 0) ? `None` : `<@&${guild.configurationManager.configuration.roleadder.whitelist.join(`>, <@&`)}>`, true);
                        embed.addField(`**Users scoped :**`, `${total}`, true);
                        embed.addField(`**Users left to add the role to :**`, `${Object.keys(guild.roleadder.queue).length}`, true);
                        msg.edit({
                            embeds: [embed],
                            failIfNotExists: false
                        }).catch(e => {});
                    }
                }, (total > 500) ? 10000 : 2000);


            }).catch(e => utils.messageReplyFailLogger(message, guild, e));

            for (const key in guild.roleadder.queue) {
                if (typeof args[1] == "string" && (args[1].toLocaleLowerCase() == "testrun" || args[1].toLocaleLowerCase() == "jk" || args[1].toLocaleLowerCase() == "fake")) {
                    MainLog.log(`Added role(e) [${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`, `)}] to ${guild.roleadder.queue[key].user.username}#${guild.roleadder.queue[key].user.discriminator}(${guild.roleadder.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id}) [Test run, role(s) not added]`);
                    if (guild.configurationManager.configuration.roleadder.logAddedUsers && guild.logToChannel.initialized) guild.channelLog(`Added role(s) [${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`, `)}] to ${guild.roleadder.queue[key].user.username}#${guild.roleadder.queue[key].user.discriminator}(${guild.roleadder.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id}) [Test run, role(s) not added]`);
                    delete guild.roleadder.queue[key];
                } else {
                    guild.roleadder.queue[key].roles.add(guild.configurationManager.configuration.roleadder.rolesToAdd, `${addReasonPlaceholder(guild.configurationManager.configuration.roleadder.addReason, message.author, `Manual Trigger`)}`).then(() => {
                        MainLog.log(`Added role(e) [${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`, `)}] to ${guild.roleadder.queue[key].user.username}#${guild.roleadder.queue[key].user.discriminator}(${guild.roleadder.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id})`);
                        if (guild.configurationManager.configuration.roleadder.logAddedUsers && guild.logToChannel.initialized) guild.channelLog(`Added role(s) [${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`, `)}] to ${guild.roleadder.queue[key].user.username}#${guild.roleadder.queue[key].user.discriminator}(${guild.roleadder.queue[key].user.id}) - Manual Trigger by ${message.author.tag}(${message.author.id})`);
                        delete guild.roleadder.queue[key];
                    }).catch(e => {
                        MainLog.log(`Could not add role(s) [${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`, `)}] to ${guild.roleadder.queue[key].user.username}#${guild.roleadder.queue[key].user.discriminator}(${guild.roleadder.queue[key].user.id}) [${e.toString()}]`);
                        if (guild.configurationManager.configuration.roleadder.logAddedUsers && guild.logToChannel.initialized) guild.channelLog(`Could not add role(s) [${guild.configurationManager.configuration.roleadder.rolesToAdd.join(`, `)}] to ${guild.roleadder.queue[key].user.username}#${guild.roleadder.queue[key].user.discriminator}(${guild.roleadder.queue[key].user.id}) [${e.toString()}]`);
                        delete guild.roleadder.queue[key];
                    });
                }
            }
            return true;
        }

        if (args[0].toLowerCase() == "clearpending" || args[0].toLowerCase() == "clear") {
            let permissionToCheck = this.nestedPermissions.use;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (typeof guild.roleadder == "undefined") return utils.sendError(message, guild, `Error`, `Nothing to clear. Run \`${(typeof guild == "undefined") ? globalConfiguration.configuration.prefix : guild.configurationManager.configuration.prefix}roleadder prepare\` to trigger the fetching.`, [], true); /*Updated To New Utils*/
            if (typeof guild.roleadder != "undefined") delete guild.roleadder;
            return utils.sendError(message, guild, `Pending cleared`, undefined, [], true); /*Updated To New Utils*/
        }

        if (args[0].toLowerCase() == "reasonhelp" && false) {
            let embed = new MessageEmbed({
                title: `${globalConfiguration.configuration.appName}'s roleadder Reason Helper`,
                color: guild.configurationManager.configuration.colors.main,
                description: `**Here is some help to configure the kick reason :**
                                *You can use any of the placeholders shown below.*
                            Current reason :
                            Value: \`${guild.configurationManager.configuration.roleadder.addReason}\`
                            Display: \`${addReasonPlaceholder(guild.configurationManager.configuration.roleadder.addReason, message.author, `Manual Trigger`)}\``
            });

            embed.addField(`&{AppName}`, `Shows the bot app name.\n\`${globalConfiguration.configuration.appName}\``, true);
            embed.addField(`&{TriggerUserID}`, `Shows the trigger user ID.\n\`${message.author.id}\``, true);
            embed.addField(`&{TriggerUserTag}`, `Shows the trigger user tag.\n\`${message.author.username}#${message.author.discriminator}\``, true);
            embed.addField(`&{TriggerReason}`, `Shows the trigger reason.\n\`Manual Trigger\``, true);
            embed.addField(`&{BotTag}`, `Shows the bots tag.\n\`${client.user.tag}\``, true);
            embed.addField(`More infos :`, `Any user related placeholders such as \`TriggerUserID\` and \`TriggerUserTag\` will show [AUTOMATIC] if its not a manual trigger.`, false);

            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        return utils.sendError(message, guild, `Unknown subcommand`, undefined, [], true); /*Updated To New Utils*/
    }
}

function addReasonPlaceholder(reason, TriggerUser, TriggerReason) {
    let newReason = reason;
    newReason = newReason.replace('&{AppName}', `${globalConfiguration.configuration.appName}`);
    newReason = newReason.replace('&{TriggerUserID}', `${TriggerUser.id}`);
    newReason = newReason.replace('&{TriggerUserTag}', `${TriggerUser.username}#${TriggerUser.discriminator}`);
    newReason = newReason.replace('&{TriggerReason}', `${TriggerReason}`);
    newReason = newReason.replace('&{BotTag}', `${client.user.tag}`);
    return newReason;
}