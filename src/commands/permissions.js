const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "permissions",
    description: `Configure the permissions`,
    aliases: ["perms", "permission"],
    permission: `commands.permissions`,
    category: `administration`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let response = "**Global Permission Helper**";

            response += "\n\nHow to use : *(<Needed Parameter> [Optionnal Parameter])*";
            response += `\n\`${guild.configuration.prefix}${this.name} show/infos/list <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole>\` *shows the current perm of a selected scope.*`;
            response += `\n\`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole> <permission> <true/false> [priority]\` *set the permission for a selected scope.*`;
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
            if (args.length != 2) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} show/infos <@User/@Role/userid:UserID/internalRole:internalRole>\``);
            await guild.permissionsManager.load();
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                if (typeof guild.permissionsManager.permissions.users[user.id] == "object" && Object.keys(guild.permissionsManager.permissions.users[user.id]).length != 0)
                    return sendPermissions(message, guild, `${user.tag}`, guild.permissionsManager.permissions.users[user.id]);
                return sendPermissions(message, guild, `${user.tag}`, {
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
                if (typeof guild.permissionsManager.permissions.roles[role.id] == "object")
                    return sendPermissions(message, guild, `${role.name}@${message.channel.guild.name}`, guild.permissionsManager.permissions.roles[role.id]);
                return sendPermissions(message, guild, `${role.name}@${message.channel.guild.name}`, {
                    "No Permissions": "This scope has nothing specified."
                });
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let role = args[1].toLowerCase().replace('internalrole:', '');

                if (typeof guild.permissionsManager.permissions.internalRoles[role] == "object" && Object.keys(guild.permissionsManager.permissions.internalRoles[role]).length != 0)
                    return sendPermissions(message, guild, `internalRole.${role}`, guild.permissionsManager.permissions.internalRoles[role]);
                return sendPermissions(message, guild, `internalRole.${role}@${role.guild.name}`, {
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
                for (const userId in guild.permissionsManager.permissions.users) {
                    let fieldBody = ``;
                    for (const permissionName in guild.permissionsManager.permissions.users[userId]) {
                        if (typeof guild.permissionsManager.permissions.users[userId][permissionName] == "boolean") guild.permissionsManager.permissions.users[userId][permissionName] = {
                            value: guild.permissionsManager.permissions.users[userId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${guild.permissionsManager.permissions.users[userId][permissionName].priority}] ${guild.permissionsManager.permissions.users[userId][permissionName].value}\n`
                    }
                    embeds.users.fields.push([`User ${userId}`, `${fieldBody}`, false])
                }
                for (const roleName in guild.permissionsManager.permissions.internalRoles) {
                    let fieldBody = ``;
                    for (const permissionName in guild.permissionsManager.permissions.internalRoles[roleName]) {
                        if (typeof guild.permissionsManager.permissions.internalRoles[roleName][permissionName] == "boolean") guild.permissionsManager.permissions.internalRoles[roleName][permissionName] = {
                            value: guild.permissionsManager.permissions.internalRoles[roleName][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${guild.permissionsManager.permissions.internalRoles[roleName][permissionName].priority}] ${guild.permissionsManager.permissions.internalRoles[roleName][permissionName].value}\n`
                    }
                    embeds.internalRoles.fields.push([`Internal Role ${roleName}`, `${fieldBody}`, false])
                }
                for (const roleId in guild.permissionsManager.permissions.roles) {
                    let fieldBody = ``;
                    for (const permissionName in guild.permissionsManager.permissions.roles[roleId]) {
                        if (typeof guild.permissionsManager.permissions.roles[roleId][permissionName] == "boolean") guild.permissionsManager.permissions.roles[roleId][permissionName] = {
                            value: guild.permissionsManager.permissions.roles[roleId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${guild.permissionsManager.permissions.roles[roleId][permissionName].priority}] ${guild.permissionsManager.permissions.roles[roleId][permissionName].value}\n`
                    }
                    embeds.roles.fields.push([`Role ${roleId}`, `${fieldBody}`, false])
                }
                for (const channelId in guild.permissionsManager.permissions.channels) {
                    let fieldBody = ``;
                    for (const permissionName in guild.permissionsManager.permissions.channels[channelId]) {
                        if (typeof guild.permissionsManager.permissions.channels[channelId][permissionName] == "boolean") guild.permissionsManager.permissions.channels[channelId][permissionName] = {
                            value: guild.permissionsManager.permissions.channels[channelId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${guild.permissionsManager.permissions.channels[channelId][permissionName].priority}] ${guild.permissionsManager.permissions.channels[channelId][permissionName].value}\n`
                    }
                    embeds.channels.fields.push([`Channel ${channelId}`, `${fieldBody}`, false])
                }
                for (const guildId in guild.permissionsManager.permissions.guilds) {
                    let fieldBody = ``;
                    for (const permissionName in guild.permissionsManager.permissions.guilds[guildId]) {
                        if (typeof guild.permissionsManager.permissions.guilds[guildId][permissionName] == "boolean") guild.permissionsManager.permissions.guilds[guildId][permissionName] = {
                            value: guild.permissionsManager.permissions.guilds[guildId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${guild.permissionsManager.permissions.guilds[guildId][permissionName].priority}] ${guild.permissionsManager.permissions.guilds[guildId][permissionName].value}\n`
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
            return utils.sendError(message, guild, `Unknown scope`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} show <@User/@Role/userid:UserID/internalRole:internalRole>\``);
        }

        if (args[0] == "set") {
            if (args.length != 4 && args.length != 5) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value> [priority]\``);
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
                if (typeof guild.permissionsManager.permissions.users[user.id] != "object") guild.permissionsManager.permissions.users[user.id] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.users[user.id][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete guild.permissionsManager.permissions.users[user.id][permissionName];
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
                if (typeof guild.permissionsManager.permissions.roles[role.id] != "object") guild.permissionsManager.permissions.roles[role.id] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.roles[role.id][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete guild.permissionsManager.permissions.roles[role.id][permissionName];
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a internalrole
                let internalrole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${internalrole}\`.`;
                if (typeof guild.permissionsManager.permissions.internalRoles[internalrole] != "object") guild.permissionsManager.permissions.internalRoles[internalrole] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.internalRoles[internalrole][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete guild.permissionsManager.permissions.internalRoles[internalrole][permissionName];
            }
            if (args[1].toLowerCase().startsWith("guild")) { //About a guild
                let guild = args[1].toLowerCase().replace('guild:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${guild.id}\` with priority \`${permissionPriority}\`.`;
                if (typeof guild.permissionsManager.permissions.guild[guild] != "object") guild.permissionsManager.permissions.guild[guild] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.guild[guild][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete guild.permissionsManager.permissions.guild[guild][permissionName];
            }
            await guild.permissionsManager.save();
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0] == "unset" || args[0] == "remove") {
            if (args.length != 3) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} unset/remove <@User/@Role/userid:UserID/internalRole:internalRole> <permission>\``);
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
                if (typeof guild.permissionsManager.permissions.users[user.id] != "object") guild.permissionsManager.permissions.users[user.id] = {};
                delete guild.permissionsManager.permissions.users[user.id][permissionName];
                if (Object.keys(guild.permissionsManager.permissions.users[user.id]).length == 0) delete guild.permissionsManager.permissions.users[user.id];
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
                if (typeof guild.permissionsManager.permissions.roles[role.id] != "object") guild.permissionsManager.permissions.roles[role.id] = {};
                delete guild.permissionsManager.permissions.roles[role.id][permissionName];
                if (Object.keys(guild.permissionsManager.permissions.roles[role.id]).length == 0) delete guild.permissionsManager.permissions.roles[role.id];
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let internalRole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission unset.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope \`${internalRole}\`.`;
                if (typeof guild.permissionsManager.permissions.internalRoles[internalRole] != "object") guild.permissionsManager.permissions.internalRoles[internalRole] = {};
                delete guild.permissionsManager.permissions.internalRoles[internalRole][permissionName];
                if (Object.keys(guild.permissionsManager.permissions.internalRoles[internalRole]).length == 0) delete guild.permissionsManager.permissions.internalRoles[internalRole];
            }
            await guild.permissionsManager.save();
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        return utils.sendError(message, guild, `Error`, `Unknown subcommand.`);
    }
}

function sendPermissions(message, guild, scope, permissions) {
    let embed = new MessageEmbed({
        title: `Permissions for scope ${scope}`,
        color: guild.configuration.colors.main
    });


    for (const permission in permissions) {
        if (typeof permissions[permission] == "boolean") permissions[permission] = {
            value: permissions[permission],
            priority: 0,
            temporary: false
        };
        embed.addField(`**${permission}**`, (typeof permissions[permission] == "string") ? `${permissions[permission]}` : `**[${permissions[permission].priority}]** ${permissions[permission].value}`, true);
    }

    message.reply({
        embeds: [embed],
        failIfNotExists: false
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
    }).catch(e => utils.messageDeleteFailLogger(message, guild, e));
    return true;
}