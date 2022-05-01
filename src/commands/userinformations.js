const {
    MessageEmbed
} = require(`discord.js`);
const moment = require("moment");
const {
    configuration
} = require(`../../index`);
const urlExists = require('url-exists');

const utils = require(`../utils`);

module.exports = {
    name: "userinformations",
    description: `Show information of a member.`,
    aliases: ["userinfo", "whois"],
    permission: `commands.userinformations`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let user = undefined;

        if (args.length != 0) {
            user = (args[0].startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
                cache: false,
                force: true
            }).catch(e => {
                return undefined;
            }) : await message.channel.guild.members.fetch({
                cache: false,
                force: true
            }).then(members => members.find(member => member.user.tag === args[0]));
            if (typeof user == "undefined") user = await message.channel.guild.members.fetch(args[0], {
                cache: false,
                force: true
            }).catch(e => {
                return undefined;
            });
            if (typeof user == "undefined") return utils.sendError(message, guild, `Could not get user data`, `User not found`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }
        if (args.length == 0) user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        let userPFP = await utils.getUserPfp(user);

        let embed = new MessageEmbed({
            title: `Moderation Statistics`,
            description: `<@${user.user.id}>`,
            color: user.displayHexColor,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });

        let userRoles = [];
        let userPermissions = [];
        let memberRoles = user.roles.cache;
        memberRoles.sort((a,b) =>  b.rawPosition-a.rawPosition )
        memberRoles.forEach(memberRole => {
            if (memberRole.name != "@everyone") userRoles.push(memberRole.id);
            let perms = memberRole.permissions.serialize(false);
            for (const permission in perms) {
                if (perms[permission] == true)
                    if (!userPermissions.includes(permission)) userPermissions.push(permission);
            }
        });
        let userAcknowledgements = toAcknowledgements(user, guild, userPermissions);
        userPermissions = toKeyPermissions(userPermissions);

        embed.addField(`**Joined**`, `<t:${moment(user.joinedTimestamp).unix()}>`, true);
        embed.addField(`**Registered**`, `<t:${moment(user.user.createdTimestamp).unix()}>`, true);
        embed.addField(`**Roles** [${userRoles.length}]`, `${(userRoles.length == 0) ? `None` : (userRoles.join(`> <@&`).length > 1024) ? `Too many roles to show.` : `<@&${userRoles.join(`> <@&`)}>`}`, false);
        embed.addField(`**Key Permissions**`, `${(userPermissions.length == 0) ? `None` : `${userPermissions.join(', ')}`}`, false);
        embed.addField(`**Acknowledgements**`, `${userAcknowledgements}`, false);
        /*Custom Specifications for the bot itself*/if (user.user.id == client.user.id) embed.addField(`**Specifications**`, `- Is really nice\n- Is really cool\n- Built by <@231461358200291330>\n- Idea from <@330826518370451457>`, false);
        embed.addField(`**Infos**`, `ID: ${user.user.id} • <t:${moment().unix()}>`, false);


        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}



function toKeyPermissions(userPermissions) {
    let newUserPermissions = [];
    if (userPermissions.includes(`ADMINISTRATOR`)) newUserPermissions.push(`Administrator`);
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
        })) currentAcknowledgements = `Server Administrator`;
    if (guild.guild.ownerId == user.user.id) currentAcknowledgements = `Server Owner`;
    return currentAcknowledgements;
}