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
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let permissionManager = guild.permissionsManager;


        if (args.length == 0) {
            let response = "**Global Permission Helper**";

            response += "\n\nHow to use : *(<Needed Parameter> [Optionnal Parameter])*";
            response += `\n\`${guild.configurationManager.configuration.prefix}${this.name} show/infos/list <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole>\` *shows the current perm of a selected scope.*`;
            response += `\n\`${guild.configurationManager.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole> <permission> <true/false> [priority]\` *set the permission for a selected scope.*`;
            response += `\n\`${guild.configurationManager.configuration.prefix}${this.name} unset/remove <@User/@Role/userid:UserID/roleid:RoleID/internalRole:internalRole> <permission>\` *completely remove the permission from the selected scope.*`;
            response += `\nUserID & internalRole scopes must be written litterally like shown here => (UserID exemple : \`userid:933695613294501888\`)(internalRole exemple : \`internalRole:0\`)`;
            response += `\nInternalRole has **nothing** to do with discord itself. Its a custom role process hand-coded that has nothing to do with the Guild roles.`;
            response += `\nAdding the \`*\` permission with the \`false\` value will completely overwrite the lower priority scopes perms.`;
            response += `\nScope priority order : User > InternalRole > Role.`;

            message.reply(response, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        if (args[0] == "show" || args[0] == "infos" || args[0] == "list") {
            await permissionManager.load();
            if (args[1].startsWith("<@!") || args[1].startsWith("<@") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith("<@")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                if (typeof permissionManager.configuration.users[user.id] == "object" && Object.keys(permissionManager.configuration.users[user.id]).length != 0)
                    return sendPermissions(message, guild, args, `${user.tag}`, permissionManager.configuration.users[user.id]);
                return sendPermissions(message, guild, args, `${user.tag}`, {});
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
                if (typeof permissionManager.configuration.roles[role.id] == "object")
                    return sendPermissions(message, guild, args, `${role.name}@${message.channel.guild.name}`, permissionManager.configuration.roles[role.id]);
                return sendPermissions(message, guild, args, `${role.name}@${message.channel.guild.name}`, {});
            }
            if (args[1].toLowerCase().startsWith("internalrole:")) { //About a role
                let role = args[1].toLowerCase().replace('internalrole:', '');

                if (typeof permissionManager.configuration.internalRoles[role] == "object" && Object.keys(permissionManager.configuration.internalRoles[role]).length != 0)
                    return sendPermissions(message, guild, args, `internalRole.${role}`, permissionManager.configuration.internalRoles[role]);
                return sendPermissions(message, guild, args, `internalRole.${role}@${role.guild.name}`, {});
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
                for (const userId in permissionManager.configuration.users) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.configuration.users[userId]) {
                        if (typeof permissionManager.configuration.users[userId][permissionName] == "boolean") permissionManager.configuration.users[userId][permissionName] = {
                            value: permissionManager.configuration.users[userId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.configuration.users[userId][permissionName].priority}] ${permissionManager.configuration.users[userId][permissionName].value}\n`
                    }
                    embeds.users.fields.push([`User ${userId}`, `${fieldBody}`, false])
                }
                for (const roleName in permissionManager.configuration.internalRoles) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.configuration.internalRoles[roleName]) {
                        if (typeof permissionManager.configuration.internalRoles[roleName][permissionName] == "boolean") permissionManager.configuration.internalRoles[roleName][permissionName] = {
                            value: permissionManager.configuration.internalRoles[roleName][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.configuration.internalRoles[roleName][permissionName].priority}] ${permissionManager.configuration.internalRoles[roleName][permissionName].value}\n`
                    }
                    embeds.internalRoles.fields.push([`Internal Role ${roleName}`, `${fieldBody}`, false])
                }
                for (const roleId in permissionManager.configuration.roles) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.configuration.roles[roleId]) {
                        if (typeof permissionManager.configuration.roles[roleId][permissionName] == "boolean") permissionManager.configuration.roles[roleId][permissionName] = {
                            value: permissionManager.configuration.roles[roleId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.configuration.roles[roleId][permissionName].priority}] ${permissionManager.configuration.roles[roleId][permissionName].value}\n`
                    }
                    embeds.roles.fields.push([`Role ${roleId}`, `${fieldBody}`, false])
                }
                for (const channelId in permissionManager.configuration.channels) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.configuration.channels[channelId]) {
                        if (typeof permissionManager.configuration.channels[channelId][permissionName] == "boolean") permissionManager.configuration.channels[channelId][permissionName] = {
                            value: permissionManager.configuration.channels[channelId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.configuration.channels[channelId][permissionName].priority}] ${permissionManager.configuration.channels[channelId][permissionName].value}\n`
                    }
                    embeds.channels.fields.push([`Channel ${channelId}`, `${fieldBody}`, false])
                }
                for (const guildId in permissionManager.configuration.guilds) {
                    let fieldBody = ``;
                    for (const permissionName in permissionManager.configuration.guilds[guildId]) {
                        if (typeof permissionManager.configuration.guilds[guildId][permissionName] == "boolean") permissionManager.configuration.guilds[guildId][permissionName] = {
                            value: permissionManager.configuration.guilds[guildId][permissionName],
                            priority: 0,
                            temporary: false
                        };
                        fieldBody += `**${permissionName}**: [${permissionManager.configuration.guilds[guildId][permissionName].priority}] ${permissionManager.configuration.guilds[guildId][permissionName].value}\n`
                    }
                    embeds.guilds.fields.push([`Guild ${guildId}`, `${fieldBody}`, false])
                }

                let introEmbed = new MessageEmbed({
                    title: `Permissions list:`,
                    color: guild.configurationManager.configuration.colors.main
                });
                let embedsToAdd = [introEmbed];
                for (const embedName in embeds) {
                    let indEmbed = embeds[embedName];
                    let permissionEmbed = new MessageEmbed({
                        title: indEmbed.title,
                        color: guild.configurationManager.configuration.colors.main,
                        description: (indEmbed.fields.length == 0) ? `No permissions defined` : undefined
                    });
                    if (indEmbed.fields.length != 0) indEmbed.fields.forEach(indField => permissionEmbed.addField(`${indField[0]}`, `${indField[1]}`, indField[2]));
                    embedsToAdd.push(permissionEmbed);
                }
                return message.reply({
                    embeds: embedsToAdd,
                    failIfNotExists: false
                }, false).then(msg => {
                    if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            }
            return utils.sendError(message, guild, `Unknown scope`, `This command must have this synthax : \`${guild.configurationManager.configuration.prefix}${this.name} show <@User/@Role/userid:UserID/internalRole:internalRole>\``, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }

        if (args[0] == "set") {
            if (args.length != 4 && args.length != 5) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configurationManager.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value> [priority]\``, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
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
                color: guild.configurationManager.configuration.colors.error,
                description: `This command must have this synthax : \`${guild.configurationManager.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value> [priority]\``
            });
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', '')).catch(e => {

                });
                embed.title = `Permission set.`;
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope <@${user.id}>.`;
                if (typeof permissionManager.configuration.users[user.id] != "object") permissionManager.configuration.users[user.id] = {};
                if (permissionValue != "none") permissionManager.configuration.users[user.id][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.configuration.users[user.id][permissionName];
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
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope <@&${role.id}>.`;
                if (typeof permissionManager.configuration.roles[role.id] != "object") permissionManager.configuration.roles[role.id] = {};
                if (permissionValue != "none") permissionManager.configuration.roles[role.id][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.configuration.roles[role.id][permissionName];
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a internalrole
                let internalrole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${internalrole}\`.`;
                if (typeof permissionManager.configuration.internalRoles[internalrole] != "object") permissionManager.configuration.internalRoles[internalrole] = {};
                if (permissionValue != "none") permissionManager.configuration.internalRoles[internalrole][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.configuration.internalRoles[internalrole][permissionName];
            }
            if (args[1].toLowerCase().startsWith("guild")) { //About a guild
                let guild = args[1].toLowerCase().replace('guild:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${guild.id}\` with priority \`${permissionPriority}\`.`;
                if (typeof permissionManager.configuration.guild[guild] != "object") permissionManager.configuration.guild[guild] = {};
                if (permissionValue != "none") permissionManager.configuration.guild[guild][permissionName] = {
                    value: permissionValue,
                    priority: permissionPriority,
                    temporary: false
                };
                if (permissionValue == "none") delete permissionManager.configuration.guild[guild][permissionName];
            }
            await permissionManager.save();
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0] == "unset" || args[0] == "remove") {
            if (args.length != 3) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configurationManager.configuration.prefix}${this.name} unset/remove <@User/@Role/userid:UserID/internalRole:internalRole> <permission>\``, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
            let permissionName = args[2];
            let embed = new MessageEmbed({
                title: `Unknown scope`,
                color: guild.configurationManager.configuration.colors.error,
                description: `This command must have this synthax : \`${guild.configurationManager.configuration.prefix}${this.name} unset <@User/@Role/userid:UserID/internalRole:internalRole> <permission>\``
            });
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                embed.title = `Permission unset.`;
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope <@${user.id}>.`;
                if (typeof permissionManager.configuration.users[user.id] != "object") permissionManager.configuration.users[user.id] = {};
                delete permissionManager.configuration.users[user.id][permissionName];
                if (Object.keys(permissionManager.configuration.users[user.id]).length == 0) delete permissionManager.configuration.users[user.id];
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
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope <@&${role.id}>.`;
                if (typeof permissionManager.configuration.roles[role.id] != "object") permissionManager.configuration.roles[role.id] = {};
                delete permissionManager.configuration.roles[role.id][permissionName];
                if (Object.keys(permissionManager.configuration.roles[role.id]).length == 0) delete permissionManager.configuration.roles[role.id];
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let internalRole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission unset.`;
                embed.color = guild.configurationManager.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope \`${internalRole}\`.`;
                if (typeof permissionManager.configuration.internalRoles[internalRole] != "object") permissionManager.configuration.internalRoles[internalRole] = {};
                delete permissionManager.configuration.internalRoles[internalRole][permissionName];
                if (Object.keys(permissionManager.configuration.internalRoles[internalRole]).length == 0) delete permissionManager.configuration.internalRoles[internalRole];
            }
            await permissionManager.save();
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        return utils.sendError(message, guild, `Error`, `Unknown subcommand.`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
    }
}

function sendPermissions(message, guild, args, scope, permissions) {
    let embedFields = [];
    let embedPages = [];
    let page = 1;
    let embed = new MessageEmbed({
        title: `${Object.keys(permissions).length} permissions set for scope ${scope}`,
        color: guild.configurationManager.configuration.colors.main
    });


    for (const permission in permissions) {
        if (typeof permissions[permission] == "boolean") permissions[permission] = {
            value: permissions[permission],
            priority: 0,
            temporary: false
        };
        embedFields.push([`**${permission}**`, (typeof permissions[permission] == "string") ? `${permissions[permission]}` : `**[${permissions[permission].priority}]** ${permissions[permission].value}`, true]);
    }

    if (Object.keys(permissions).length == 0)embedFields.push([`**No Permissions**`, `This scope has nothing specified.`, true]);

    embedPages = splitArrayIntoChunksOfLen(embedFields, 9);
    embed.footer = {
        text: `Use \`[-page:pageNumber]\` to search thru pages. [1/${embedPages.length}]`
    };

    embedFields = embedPages[0];

    args.forEach(async invividualArgument => {
        if (invividualArgument.toLowerCase().startsWith("-page:")) {
            try {
                page = parseInt(invividualArgument.replace('-page:', ``));
                args = args.filter(arrayItem => arrayItem !== invividualArgument);
                if (typeof embedPages[page - 1] == "undefined") return page = `This page does not exist`;
                embed.footer = {
                    text: `Use \`${guild.configurationManager.configuration.prefix}help [page number] [category]\` to search thru pages. [${page}/${embedPages.length}]`
                };
                embedFields = embedPages[page - 1];
            } catch (e) {
                return page = `Pages must be selected by numbers.`;
            }
        }
    });

    if (typeof page == "string") return utils.sendError(message, guild, page, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/

    embedFields.forEach(embedField => {
        embed.addField(embedField[0], embedField[1], embedField[2]);
    });

    message.reply({
        embeds: [embed],
        failIfNotExists: false
    }, false).then(msg => {
        if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
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