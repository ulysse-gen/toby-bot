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
            if (args.length != 2) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} show/infos <@User/@Role/userid:UserID/internalRole:internalRole>\``);
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
                if (args[1].startsWith('roleid:')) role = {
                    id: args[1].replace('roleid:', ''),
                    guild: {
                        id: message.channel.guild.id
                    }
                }
                if (typeof guild.permissionsManager.permissions.roles[role.guild.id] == "object" && typeof guild.permissionsManager.permissions.roles[role.guild.id][role.id] == "object")
                    return sendPermissions(message, guild, `${role.name}@${message.channel.guild.name}`, guild.permissionsManager.permissions.roles[role.guild.id][role.id]);
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
            if (args[1].toLowerCase().startsWith("*") && false) { //About a role
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
                guild.permissionsManager.permissions.users.forEach(data => embeds.fields.push([`<@${data}>`, `***Permissions :*** ${guild.permissionsManager.permissions.users[data][permissionName].join('\n')}`, false]));
                guild.permissionsManager.permissions.internalRoles.forEach(data => embeds.fields.push([`<@${data}>`, `***Permissions :*** ${guild.permissionsManager.permissions.internalRoles[data][permissionName].join('\n')}`, false]));
                guild.permissionsManager.permissions.roles.forEach(data => embeds.fields.push([`<@${data}>`, `***Permissions :*** ${guild.permissionsManager.permissions.roles[data][permissionName].join('\n')}`, false]));


                console.log(embeds);

                for (const indEmbed of embeds) {
                    let usersPermissionsEmbed = new MessageEmbed({
                        title: indEmbed.title,
                        color: guild.configuration.colors.main
                    });
                    indEmbed.fields.forEach(indField => usersPermissionsEmbed.addField(`${indField[0]}`, `${indField[1]}`, indField[2]));
                    message.reply({
                        embeds: [usersPermissionsEmbed],
                        failIfNotExists: false
                    }, false).then(msg => {
                        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                    }).catch(e => utils.messageReplyFailLogger(message, guild, e));
                }



            }
            return utils.sendError(message, guild, `Unknown scope`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} show <@User/@Role/userid:UserID/internalRole:internalRole>\``);
        }

        if (args[0] == "set") {
            if (args.length != 4)
                if (args.length != 2) return utils.sendError(message, guild, `Wrong command synthax`, `This command must have this synthax : \`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value>\``);
            let permissionName = args[2];
            let permissionValue = (args[0] == "none") ? "none" : (args[3] == '1' || args[3] == "true" || args[3] == "yes") ? true : false;
            let embed = new MessageEmbed({
                title: `Unknown scope`,
                color: guild.configuration.colors.error,
                description: `This command must have this synthax : \`${guild.configuration.prefix}${this.name} set <@User/@Role/userid:UserID/internalRole:internalRole> <permission> <value>\``
            });
            if (args[1].startsWith("<@!") || args[1].startsWith('userid:')) { //About a user
                let user = args[1];
                if (args[1].startsWith("<@!")) user = message.mentions.users.first();
                if (args[1].startsWith('userid:')) user = await client.users.fetch(args[1].replace('userid:', ''));
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope <@${user.id}>.`;
                if (typeof guild.permissionsManager.permissions.users[user.id] != "object") guild.permissionsManager.permissions.users[user.id] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.users[user.id][permissionName] = permissionValue;
                if (permissionValue == "none") delete guild.permissionsManager.permissions.users[user.id][permissionName];
                guild.permissionsManager.save();
            }
            if (args[1].startsWith("<@&") || args[1].startsWith('roleid:')) { //About a role
                let role = message.mentions.roles.first();
                if (args[1].startsWith('roleid:')) role = {
                    id: args[1].replace('roleid:', ''),
                    guild: {
                        id: message.channel.guild.id
                    }
                }
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope <@&${role.id}>.`;
                if (typeof guild.permissionsManager.permissions.roles[role.guild.id] != "object") guild.permissionsManager.permissions.roles[role.guild.id] = {};
                if (typeof guild.permissionsManager.permissions.roles[role.guild.id][role.id] != "object") guild.permissionsManager.permissions.roles[role.guild.id][role.id] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.roles[role.guild.id][role.id][permissionName] = permissionValue;
                if (permissionValue == "none") delete guild.permissionsManager.permissions.roles[role.guild.id][role.id][permissionName];
                guild.permissionsManager.save();
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a internalrole
                let internalrole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${internalrole}\`.`;
                if (typeof guild.permissionsManager.permissions.internalRoles[internalrole] != "object") guild.permissionsManager.permissions.internalRoles[internalrole] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.internalRoles[internalrole][permissionName] = permissionValue;
                if (permissionValue == "none") delete guild.permissionsManager.permissions.internalRoles[internalrole][permissionName];
                guild.permissionsManager.save();
            }
            if (args[1].toLowerCase().startsWith("guild")) { //About a guild
                let guild = args[1].toLowerCase().replace('guild:', '');
                embed.title = `Permission set.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` set to \`${permissionValue}\` for scope \`${guild.id}\`.`;
                if (typeof guild.permissionsManager.permissions.guild[guild] != "object") guild.permissionsManager.permissions.guild[guild] = {};
                if (permissionValue != "none") guild.permissionsManager.permissions.guild[guild][permissionName] = permissionValue;
                if (permissionValue == "none") delete guild.permissionsManager.permissions.guild[guild][permissionName];
                guild.permissionsManager.save();
            }
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
                guild.permissionsManager.save();
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
                if (typeof guild.permissionsManager.permissions.roles[role.guild.id] != "object") guild.permissionsManager.permissions.roles[role.guild.id] = {};
                if (typeof guild.permissionsManager.permissions.roles[role.guild.id][role.id] != "object") guild.permissionsManager.permissions.roles[role.guild.id][role.id] = {};
                delete guild.permissionsManager.permissions.roles[role.guild.id][role.id][permissionName];
                guild.permissionsManager.save();
            }
            if (args[1].toLowerCase().startsWith("internalrole")) { //About a role
                let internalRole = args[1].toLowerCase().replace('internalrole:', '');
                embed.title = `Permission unset.`;
                embed.color = guild.configuration.colors.main;
                embed.description = `Permission \`${permissionName}\` unset from scope \`${internalRole}\`.`;
                if (typeof guild.permissionsManager.permissions.internalRoles[internalRole] != "object") guild.permissionsManager.permissions.internalRoles[internalRole] = {};
                delete guild.permissionsManager.permissions.internalRoles[internalRole][permissionName];
                guild.permissionsManager.save();
            }
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
        embed.addField(`**${permission}**`, `${permissions[permission]}`, true);
    }

    message.reply({
        embeds: [embed],
        failIfNotExists: false
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
    }).catch(e => utils.messageDeleteFailLogger(message, guild, e));
    return true;
}