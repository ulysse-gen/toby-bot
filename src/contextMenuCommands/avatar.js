const { MessageEmbed } = require('discord.js');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const moment = require('moment');

module.exports = {
    name: "avatar",
    displayName: "Show Avatar",
    type: "USER",
    permission: "command.avatar",
    enabled: true,
    async execute(ContextMenuCommandExecution) {
        let User = await ContextMenuCommandExecution.Guild.getMemberById(ContextMenuCommandExecution.Trigger.targetUser.id);
        let UserPFP = await ContextMenuCommandExecution.Guild.getUserPfp(User);

        let embed = new MessageEmbed({
            color: User.displayHexColor,
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            },
            image: {
                url: `${UserPFP}?size=4096`
            }
        });

        return ContextMenuCommandExecution.returnRaw({embeds: [embed]});
    },
    makeContextMenuCommand(i18n) {
        return new ContextMenuCommandBuilder().setName(this.displayName).setType((this.type == "CHAT_INPUT") ? 1 : (this.type == "USER") ? 2 : 3);
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
    if (guild.ownerId == User.user.id) currentAcknowledgements = `***Server Owner***`;
    return currentAcknowledgements;
}