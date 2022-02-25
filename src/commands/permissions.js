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
            await guild.permissionsManager.load();
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                if (typeof guild.permissionsManager.permissions.users[user.id] == "object" && Object.keys(guild.permissionsManager.permissions.users[user.id]).length != 0)
                    return sendPermissions(message, guild, args, `${user.tag}`, guild.permissionsManager.permissions.users[user.id]);
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
                if (typeof guild.permissionsManager.permissions.roles[role.id] == "object")
                    return sendPermissions(message, guild, args, `${role.name}@${message.channel.guild.name}`, guild.permissionsManager.permissions.roles[role.id]);
                return sendPermissions(message, guild, args, `${role.name}@${message.channel.guild.name}`, {
                    "No Permissions": "This scope has nothing specified."
                });
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let role = args[1].toLowerCase().replace('internalrole:', '');

                if (typeof guild.permissionsManager.permissions.internalRoles[role] == "object" && Object.keys(guild.permissionsManager.permissions.internalRoles[role]).length != 0)
                    return sendPermissions(message, guild, args, `internalRole.${role}`, guild.permissionsManager.permissions.internalRoles[role]);
                return sendPermissions(message, guild, args, `internalRole.${role}@${role.guild.name}`, {
                    "No Permissions": "This scope has nothing specified."
                });
            }
            if (args[1].toLowerCase().startsWith("*")) { //About all
                let embeds = {
                    users: {
                        title: `**Users permissions :**`,
                        fields: [],
                        pages: []
                    },
                    internalRoles: {
                        title: `**InternalRoles permissions :**`,
                        fields: [],
                        pages: []
                    },
                    roles: {
                        title: `**Roles permissions :**`,
                        fields: [],
                        pages: []
                    },
                    channels: {
                        title: `**Channels permissions :**`,
                        fields: [],
                        pages: []
                    }
                };
                for (const unitKey in guild.permissionsManager.permissions){
                    for (const unit in guild.permissionsManager.permissions[unitKey]){
                        let fieldBody = ``;
                        let printedPerms = 0;
                        for (const permissionName in guild.permissionsManager.permissions[unitKey][unit]) {
                            printedPerms++;
                            if (typeof guild.permissionsManager.permissions[unitKey][unit][permissionName] == "boolean") guild.permissionsManager.permissions[unitKey][unit][permissionName] = {
                                value: guild.permissionsManager.permissions[unitKey][unit][permissionName],
                                priority: 0,
                                temporary: false
                            };
                            if (printedPerms > 6) {
                                fieldBody += `***${Object.keys(guild.permissionsManager.permissions[unitKey][unit]).length - 6} more permissions.***`;
                                break;
                            }
                            fieldBody += `\`${permissionName}\`: [**${guild.permissionsManager.permissions[unitKey][unit][permissionName].priority}**] ${guild.permissionsManager.permissions[unitKey][unit][permissionName].value}\n`
                        }
                        embeds[unitKey].fields.push([`**${unit}**`, `${fieldBody}`, false]);
                    }
                }

                embeds.users.pages = splitArrayIntoChunksOfLen(embeds.users.fields, 9);
                embeds.internalRoles.pages = splitArrayIntoChunksOfLen(embeds.internalRoles.fields, 9);
                embeds.roles.pages = splitArrayIntoChunksOfLen(embeds.roles.fields, 9);
                embeds.channels.pages = splitArrayIntoChunksOfLen(embeds.channels.fields, 9);

                let page = 1;

                args.forEach(async invividualArgument => {
                    if (invividualArgument.toLowerCase().startsWith("-page:")) {
                        try {
                            page = parseInt(invividualArgument.replace('-page:', ``));
                            args = args.filter(arrayItem => arrayItem !== invividualArgument);
                            if (page < 1) return page = `Page cannot be lower than 1.`;
                        } catch (e) {
                            return page = `Pages must be selected by numbers.`;
                        }
                    }
                });

                if (typeof page == "string") return utils.sendError(message, guild, page);

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
                        description: (indEmbed.fields.length == 0) ? `No permissions defined` : undefined,
                        footer: {
                            text: `Use \`-page:pageNumber]\` to search thru pages. [${(typeof indEmbed.pages[page-1] != "undefined") ? page : indEmbed.pages.length}/${indEmbed.pages.length}]`
                        }
                    });
                    if (indEmbed.fields.length != 0) indEmbed.pages[(typeof indEmbed.pages[page-1] != "undefined") ? page - 1 : indEmbed.pages.length - 1].forEach(indField => permissionEmbed.addField(`${indField[0]}`, `${indField[1]}`, indField[2]));
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

    if (typeof page == "string") return utils.sendError(message, guild, page);

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