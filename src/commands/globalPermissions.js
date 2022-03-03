const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    MainLog,
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "globalPermissions",
    description: `Configure the global permissions.`,
    aliases: ["gperms", "gpermission"],
    permission: `commands.globalpermissions`,
    nestedPermissions: {
        use: "commands.globalpermissions.show",
        manageroles: "commands.globalpermissions.set",
        settings: "commands.globalpermissions.unset"
    },
    category: `botadministration`,
    async exec(client, message, args, guild = undefined) {
        let permissionManager = globalPermissions;

        if (args.length == 0) {
            let response = "**Global Permission Helper**";

            response += "\n\nHow to use : *(<Needed Parameter> [Optionnal Parameter])*";
            response += `\n\`${guild.configuration.prefix}${this.name} show/infos/list <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole>\` *shows the current perm of a selected scope.*`;
            response += `\n\`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole> <permission> <true/false>\` *set the permission for a selected scope.*`;
            response += `\n\`${guild.configuration.prefix}${this.name} unset/remove <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole> <permission>\` *completely remove the permission from the selected scope.*`;
            response += `\nUserID & internalRole scopes must be written litterally like shown here => (UserID exemple : \`userid:933695613294501888\`)(internalRole exemple : \`internalRole:0\`)`;
            response += `\nInternalRole has **nothing** to do with discord itself. Its a custom role process hand-coded that has nothing to do with the Guild roles.`;
            response += `\nAdding the \`*\` permission with the \`false\` value will completely overwrite the lower priority scopes perms.`;
            response += `\nScope priority order : User > InternalRole > Role.`;

            message.reply(response, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        if (args[0] == "show" || args[0] == "infos" || args[0] == "list") {
            await permissionManager.load();
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                if (typeof permissionManager.permissions.users[user.id] == "object" && Object.keys(permissionManager.permissions.users[user.id]).length != 0)
                    return sendPermissions(message, guild, args, `${user.tag}`, permissionManager.permissions.users[user.id]);
                return sendPermissions(message, guild, args, `${user.tag}`, {
                    "No Permissions": "This scope has nothing specified."
                });
            }
            if (args[1].startsWith("<@&") || args[1].startsWith('roleid:')) { //About a role
                let role = message.mentions.roles.first();
                if (args[1].startsWith('roleid:')) role = await guild.guild.roles.fetch(args[1].replace('roleid:', '')).catch(e => {
                    return {
                        id: args[1].replace('roleid:', ''),
                        name: `An error occured fetching the role name`,
                        guild: {
                            id: message.channel.guild.id
                        }
                    }
                });
                if (typeof permissionManager.permissions.roles[role.id] == "object")
                    return sendPermissions(message, guild, args, `${role.name}@${message.channel.guild.name}`, permissionManager.permissions.roles[role.id]);
                return sendPermissions(message, guild, args, `${role.name}@${message.channel.guild.name}`, {
                    "No Permissions": "This scope has nothing specified."
                });
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let role = args[1].toLowerCase().replace('internalrole:', '');

                if (typeof permissionManager.permissions.internalRoles[role] == "object" && Object.keys(permissionManager.permissions.internalRoles[role]).length != 0)
                    return sendPermissions(message, guild, args, `internalRole.${role}`, permissionManager.permissions.internalRoles[role]);
                return sendPermissions(message, guild, args, `internalRole.${role}@${role.guild.name}`, {
                    "No Permissions": "This scope has nothing specified."
                });
            }
            if (args[1].toLowerCase().startsWith("*")) { //About all
                let embeds = {
                    users: {
                        title: `Users permissions :`,
                        fields: []
                    },
                    internalRoles: {
                        title: `InternalRoles permissions :`,
                        fields: []
                    },
                    roles: {
                        title: `Roles permissions :`,
                        fields: []
                    },
                    channels: {
                        title: `Channels permissions :`,
                        fields: []
                    },
                    guilds: {
                        title: `Guilds permissions :`,
                        fields: []
                    }
                };
                for (const userId in permissionManager.permissions.users) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.permissions.users[userId]) {
                        if (typeof permissionManager.permissions.users[userId][permissionName] == "boolean") permissionManager.permissions.users[userId][permissionName] = {
                            value: permissionManager.permissions.users[userId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.permissions.users[userId][permissionName].priority}] ${permissionManager.permissions.users[userId][permissionName].value}\n`
                    }
                    embeds.users.fields.push([`User ${userId}`, `${fieldBody}`, false])
                }
                for (const roleName in permissionManager.permissions.internalRoles) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.permissions.internalRoles[roleName]) {
                        if (typeof permissionManager.permissions.internalRoles[roleName][permissionName] == "boolean") permissionManager.permissions.internalRoles[roleName][permissionName] = {
                            value: permissionManager.permissions.internalRoles[roleName][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.permissions.internalRoles[roleName][permissionName].priority}] ${permissionManager.permissions.internalRoles[roleName][permissionName].value}\n`
                    }
                    embeds.internalRoles.fields.push([`Internal Role ${roleName}`, `${fieldBody}`, false])
                }
                for (const roleId in permissionManager.permissions.roles) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.permissions.roles[roleId]) {
                        if (typeof permissionManager.permissions.roles[roleId][permissionName] == "boolean") permissionManager.permissions.roles[roleId][permissionName] = {
                            value: permissionManager.permissions.roles[roleId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.permissions.roles[roleId][permissionName].priority}] ${permissionManager.permissions.roles[roleId][permissionName].value}\n`
                    }
                    embeds.roles.fields.push([`Role ${roleId}`, `${fieldBody}`, false])
                }
                for (const channelId in permissionManager.permissions.channels) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.permissions.channels[channelId]) {
                        if (typeof permissionManager.permissions.channels[channelId][permissionName] == "boolean") permissionManager.permissions.channels[channelId][permissionName] = {
                            value: permissionManager.permissions.channels[channelId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.permissions.channels[channelId][permissionName].priority}] ${permissionManager.permissions.channels[channelId][permissionName].value}\n`
                    }
                    embeds.channels.fields.push([`Channel ${channelId}`, `${fieldBody}`, false])
                }
                for (const guildId in permissionManager.permissions.guilds) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.permissions.guilds[guildId]) {
                        if (typeof permissionManager.permissions.guilds[guildId][permissionName] == "boolean") permissionManager.permissions.guilds[guildId][permissionName] = {
                            value: permissionManager.permissions.guilds[guildId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.permissions.guilds[guildId][permissionName].priority}] ${permissionManager.permissions.guilds[guildId][permissionName].value}\n`
                    }
                    embeds.guilds.fields.push([`Guild ${guildId}`, `${fieldBody}`, false])
                }

                let introEmbed = new MessageEmbed({
                    title: `Permissions list:`,
                    color: guild.configuration.colors.main
                });
                let embedsToAdd = [introEmbed];
                for (const embedName in embeds) {
                    let indEmbed = embeds[embedName];
                    let permissionEmbed = new MessageEmbed({
                        title: indEmbed.title,
                        color: guild.configuration.colors.main,
                        description: (indEmbed.fields.length == 0) ? `No permissions defined` : undefined
                    });
                    if (indEmbed.fields.length != 0) indEmbed.fields.forEach(indField => permissionEmbed.addField(`${indField[0]}`, `${indField[1]}`, indField[2]));
                    embedsToAdd.push(permissionEmbed);
                }
                return message.reply({
                    embeds: embedsToAdd,
                    failIfNotExists: false
                }, false).then(msg => {
                    if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            }
            return utils.sendError(message, guild, `Unknown scope`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} show <@User/@Role/userid:UserID/internalRole:internalRole>\``, [], true); /*Updated To New Utils*/
        }

        if (args[0] == "set") {
            if (args.length != 4 && args.length != 5) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value> [priority]\``, [], true); /*Updated To New Utils*/
            let permissionName = args[2];
            let permissionValue = (args[3] == "none") ? "none" : (args[3] == '1' || args[3] == "true" || args[3] == "yes") ? true : false;
            let permissionPriority = (typeof args[4] == "undefined") ? 0 : args[4];
            if (typeof permissionPriority == "string") try {
                permissionPriority = parseInt(permissionPriority);
            } catch (e) {
                permissionPriority = 0;
            }
            let embed = new MessageEmbed({
                title: `Unknown scope`,
                color: guild.configuration.colors.error,
                description: `This command must have this synthax : \`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value> [priority]\``
            });
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', '')).catch(e => {

                });
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope <@${user.id}>.`;
                if (typeof permissionManager.permissions.users[user.id] != "object") permissionManager.permissions.users[user.id] = {};
                if (permissionValue != "none") permissionManager.permissions.users[user.id][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.permissions.users[user.id][permissionName];
            }
            if (args[1].startsWith("<@&") || args[1].startsWith('roleid:')) { //About a role
                let role = message.mentions.roles.first();
                if (args[1].startsWith('roleid:')) role = await guild.guild.roles.fetch(args[1].replace('roleid:', '')).catch(e => {
                    return {
                        id: args[1].replace('roleid:', ''),
                        name: `An error occured fetching the role name`,
                        guild: {
                            id: message.channel.guild.id
                        }
                    }
                });
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope <@&${role.id}>.`;
                if (typeof permissionManager.permissions.roles[role.id] != "object") permissionManager.permissions.roles[role.id] = {};
                if (permissionValue != "none") permissionManager.permissions.roles[role.id][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.permissions.roles[role.id][permissionName];
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a internalrole
                let internalrole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${internalrole}\`.`;
                if (typeof permissionManager.permissions.internalRoles[internalrole] != "object") permissionManager.permissions.internalRoles[internalrole] = {};
                if (permissionValue != "none") permissionManager.permissions.internalRoles[internalrole][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.permissions.internalRoles[internalrole][permissionName];
            }
            if (args[1].toLowerCase().startsWith("guild")) { //About a guild
                let guild = args[1].toLowerCase().replace('guild:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${guild.id}\` with priority \`${permissionPriority}\`.`;
                if (typeof permissionManager.permissions.guild[guild] != "object") permissionManager.permissions.guild[guild] = {};
                if (permissionValue != "none") permissionManager.permissions.guild[guild][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.permissions.guild[guild][permissionName];
            }
            await permissionManager.save();
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0] == "unset" || args[0] == "remove") {
            if (args.length != 3) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} unset/remove <@User/@Role/userid:UserID/internalRole:internalRole> <permission>\``, [], true); /*Updated To New Utils*/
            let permissionName = args[2];
            let embed = new MessageEmbed({
                title: `Unknown scope`,
                color: guild.configuration.colors.error,
                description: `This command must have this synthax : \`${guild.configuration.prefix}${this.name} unset <@User/@Role/userid:UserID/internalRole:internalRole> <permission>\``
            });
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                embed.title = `Permission unset.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope <@${user.id}>.`;
                if (typeof permissionManager.permissions.users[user.id] != "object") permissionManager.permissions.users[user.id] = {};
                delete permissionManager.permissions.users[user.id][permissionName];
                if (Object.keys(permissionManager.permissions.users[user.id]).length == 0) delete permissionManager.permissions.users[user.id];
            }
            if (args[1].startsWith("<@&") || args[1].startsWith('roleid:')) { //About a role
                let role = message.mentions.roles.first();
                if (args[1].startsWith('roleid:')) role = {
                    id: args[1].replace('roleid:', ''),
                    guild: {
                        id: message.channel.guild.id
                    }
                }
                embed.title = `Permission unset.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope <@&${role.id}>.`;
                if (typeof permissionManager.permissions.roles[role.id] != "object") permissionManager.permissions.roles[role.id] = {};
                delete permissionManager.permissions.roles[role.id][permissionName];
                if (Object.keys(permissionManager.permissions.roles[role.id]).length == 0) delete permissionManager.permissions.roles[role.id];
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let internalRole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission unset.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope \`${internalRole}\`.`;
                if (typeof permissionManager.permissions.internalRoles[internalRole] != "object") permissionManager.permissions.internalRoles[internalRole] = {};
                delete permissionManager.permissions.internalRoles[internalRole][permissionName];
                if (Object.keys(permissionManager.permissions.internalRoles[internalRole]).length == 0) delete permissionManager.permissions.internalRoles[internalRole];
            }
            await permissionManager.save();
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        return utils.sendError(message, guild, `Error`, `Unknown subcommand.`, [], true); /*Updated To New Utils*/
    }
}

function sendPermissions(message, guild, args, scope, permissions) {
    let embedFields = [];
    let embedPages = [];
    let page = 1;
    let embed = new MessageEmbed({
        title: `${Object.keys(permissions).length} permissions set for scope ${scope}`,
        color: guild.configuration.colors.main
    });


    for (const permission in permissions) {
        if (typeof permissions[permission] == "boolean") permissions[permission] = {
            value: permissions[permission],
            priority: 0,
            temporary: false
        };
        embedFields.push([`**${permission}**`, (typeof permissions[permission] == "string") ? `${permissions[permission]}` : `**[${permissions[permission].priority}]** ${permissions[permission].value}`, true]);
    }

    embedPages = splitArrayIntoChunksOfLen(embedFields, 9);
    embed.footer = {
        text: `Use \`-page:pageNumber]\` to search thru pages. [1/${embedPages.length}]`
    };

    embedFields = embedPages[0];

    args.forEach(async invividualArgument => {
        if (invividualArgument.toLowerCase().startsWith("-page:")) {
            try {
                page = parseInt(invividualArgument.replace('-page:', ``));
                args = args.filter(arrayItem => arrayItem !== invividualArgument);
                if (typeof embedPages[page - 1] == "undefined") return page = `This page does not exist`;
                embed.footer = {
                    text: `Use \`${guild.configuration.prefix}help [page number] [category]\` to search thru pages. [${page}/${embedPages.length}]`
                };
                embedFields = embedPages[page - 1];
            } catch (e) {
                return page = `Pages must be selected by numbers.`;
            }
        }
    });

    if (typeof page == "string") return utils.sendError(message, guild, page, undefined, [], true); /*Updated To New Utils*/

    embedFields.forEach(embedField => {
        embed.addField(embedField[0], embedField[1], embedField[2]);
    });

    message.reply({
        embeds: [embed],
        failIfNotExists: false
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
    }).catch(e => utils.messageDeleteFailLogger(message, guild, e));
    return true;
}

function splitArrayIntoChunksOfLen(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}