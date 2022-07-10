const { MessageEmbed } = require('discord.js');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const moment = require('moment');

module.exports = {
    name: "whois",
    displayName: "Show informations",
    type: "USER",
    permission: "command.whois",
    enabled: true,
    async execute(ContextMenuCommandExecution) {
        let User = await ContextMenuCommandExecution.Guild.getMemberById(ContextMenuCommandExecution.Trigger.targetUser.id);
        let UserPFP = await ContextMenuCommandExecution.Guild.getUserPfp(User);

        let embed = new MessageEmbed({
            title: ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.title`),
            description: ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.description`, {userId: User.user.id, userTag: User.user.tag}),
            color: User.displayHexColor,
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        let userRoles = [];
        let userPermissions = [];
        let memberRoles = (User.roles.cache).sort((a,b) =>  b.rawPosition-a.rawPosition);
        memberRoles.forEach(memberRole => {
            if (memberRole.name != "@everyone") userRoles.push(memberRole.id);
            let perms = memberRole.permissions.serialize(false);
            for (const permission in perms) {
                if (perms[permission] == true)
                    if (!userPermissions.includes(permission)) userPermissions.push(permission);
            }
        });
        let userAcknowledgements = toAcknowledgements(User, ContextMenuCommandExecution.Guild.guild, userPermissions);
        userPermissions = toKeyPermissions(userPermissions);

        let roleString = (userRoles.join(`> <@&`).length > 1024) ? `Too many roles to show.` : `<@&${userRoles.join(`> <@&`)}>`;
        roleString = (userRoles.length == 0) ? `None` : roleString;

        let permissionsString = (userPermissions.length == 0) ? `None` : userPermissions.join(', ');

        embed.addField(ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.joined.name`), `<t:${moment(User.joinedTimestamp).unix()}>`, true);
        embed.addField(ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.registered.name`), `<t:${moment(User.user.createdTimestamp).unix()}>`, true);
        embed.addField(ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.roles.name`, {amount: userRoles.length}), roleString, false);
        embed.addField(ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.permissions.name`), permissionsString, false);
        embed.addField(ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.acknowledgements.name`), `${userAcknowledgements}`, false);
        /*Custom Specifications for the bot itself*/if (User.user.id == ContextMenuCommandExecution.TobyBot.client.user.id) embed.addField(ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.specs.name`), ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.field.specs.content`), false);
        embed.addField(`**Infos**`, `UserID: ${User.user.id} • <t:${moment().unix()}>`, false);

        return ContextMenuCommandExecution.returnRaw({embeds: [embed]});
    },
    makeContextMenuCommand(i18n) {
        return new ContextMenuCommandBuilder().setName(this.name).setType((this.type == "CHAT_INPUT") ? 1 : (this.type == "USER") ? 2 : 3);
    }
}

function toKeyPermissions(userPermissions) {
    let newUserPermissions = [];
    if (userPermissions.includes(`ADMINISTRATOR`)) newUserPermissions.push(`**Administrator**`);
    if (userPermissions.includes(`MANAGE_GUILD`)) newUserPermissions.push(`Manage Server`);
    if (userPermissions.includes(`MANAGE_ROLES`)) newUserPermissions.push(`Manage Roles`);
    if (userPermissions.includes(`MANAGE_CHANNELS`)) newUserPermissions.push(`Manage Channels`);
    if (userPermissions.includes(`MANAGE_MESSAGES`)) newUserPermissions.push(`Manage Messages`);
    if (userPermissions.includes(`MANAGE_WEBHOOKS`)) newUserPermissions.push(`Manage Webhoocks`);
    if (userPermissions.includes(`MANAGE_NICKNAMES`)) newUserPermissions.push(`Manage Nicknames`);
    if (userPermissions.includes(`MANAGE_EMOJIS_AND_STICKERS`)) newUserPermissions.push(`Manage Emojis`);
    if (userPermissions.includes(`KICK_MEMBERS`)) newUserPermissions.push(`Kick Members`);
    if (userPermissions.includes(`BAN_MEMBERS`)) newUserPermissions.push(`Ban Members`);
    if (userPermissions.includes(`MENTION_EVERYONE`)) newUserPermissions.push(`Mention Everyone`);
    return newUserPermissions;
}

function toAcknowledgements(user, guild, userPermissions, ) {
    let currentAcknowledgements = `Server Member`;
    let serverModeratorArray = ['MANAGE_MESSAGES', 'MANAGE_NICKNAMES'];
    let serverAdministratorArray = ['ADMINISTRATOR'];
    if (user.premiumSince != null) currentAcknowledgements = `Server Booster`;
    if (serverModeratorArray.every(permission => {
            return userPermissions.includes(permission)
        })) currentAcknowledgements = `Server Moderator`;
    if (serverAdministratorArray.every(permission => {
            return userPermissions.includes(permission)
        })) currentAcknowledgements = `**Server Administrator**`;
    if (guild.ownerId == user.user.id) currentAcknowledgements = `***Server Owner***`;
    return currentAcknowledgements;
}