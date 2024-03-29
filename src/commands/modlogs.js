const {
    MessageEmbed
} = require(`discord.js`);
const mysql = require("mysql");
const urlExists = require('url-exists');
const moment = require("moment");

const utils = require(`../utils`);

module.exports = {
    name: "moderationlogs",
    description: `Show the moderation logs of a member.`,
    aliases: ["modlogs", "whattheydidwrong"],
    permission: `commands.moderationlogs`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let user = undefined;

        if (args.length != 0) {
            user = await guild.grabUser(message, args[0]);
            if (typeof user == "undefined") user = {
                id: args[0],
                user: {
                    id: args[0],
                    tag: `Unknown#Tag`
                }
            };
        }
        if (args.length == 0) user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        let userPFP = await utils.getUserPfp(user);

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: `Moderation Log`,
            color: guild.configurationManager.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });

        let makeTheStats = new Promise((res, rej) => {
            guild.moderationManager.sqlPool.query(`SELECT * FROM \`moderationLogs\` WHERE \`userId\`='${user.user.id}' AND status!='deleted' AND \`guildId\`='${message.channel.guild.id}'`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    res(null);
                }
                if (results.length == 0) {
                    res(false);
                }
                let control = results.length;
                let sticky = undefined;
                results.reverse();
                results.forEach(modAction => {
                    if (modAction.type == "Sticky" && typeof sticky == "undefined") sticky = [`**:warning: Sticky Note :**`, `**User:** <@${user.user.id}>(${user.user.id})\n**Moderator:** <@${modAction.moderatorId}>(${modAction.moderatorId})\n**Reason:** ${modAction.reason}\n**Timestamp**: <t:${moment(modAction.timestamp).unix()}>${(JSON.parse(modAction.messageHistory).length == 0) ? `` : `\n**Message history**: \`t!punishmenttranscript ${modAction.numId}\``}`, false];
                    if (modAction.type != "Sticky") {
                        if (!modAction.reason.startsWith('[RR Auto]')) embedFields.push([`**Case #${modAction.numId}**`, `**Type:** ${modAction.type}\n**User:** <@${user.user.id}>(${user.user.id})\n**Moderator:** <@${modAction.moderatorId}>(${modAction.moderatorId})\n**Reason:** ${modAction.reason}\n**Timestamp**: <t:${moment(modAction.timestamp).unix()}>${(modAction.type == "Mute" && modAction.status == "active") ? `\n**Expires:** <t:${moment(modAction.expires).unix()}>(<t:${moment(modAction.expires).unix()}:R>)` : ``}${(JSON.parse(modAction.messageHistory).length == 0) ? `` : `\n**Message history**: \`t!punishmenttranscript ${modAction.numId}\``}`, false]);
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Ban" && modAction.status == "unbanned") embedFields[embedFields.length - 1][1] += `\n**Unbanned by:** <@${modAction.updaterId}>\n**Reason:** ${modAction.updateReason}\n**Timestamp**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Ban" && modAction.status == "expired") embedFields[embedFields.length - 1][1] += `\n**Auto unbanned by TobyBot**\n**Timestamp**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Mute" && modAction.status == "unmuted") embedFields[embedFields.length - 1][1] += `\n**Unmuted by:** <@${modAction.updaterId}>\n**Reason:** ${modAction.updateReason}\n**Timestamp**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Mute" && modAction.status == "expired") embedFields[embedFields.length - 1][1] += `\n**Auto unmuted by TobyBot**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                    }
                    control--;
                    if (control <= 0) {
                        if (typeof sticky != "undefined") embedFields.unshift(sticky);
                        res(true);
                    }
                });
                res(true);
            });
        });

        await makeTheStats;

        if (embedFields.length == 0) {
            embed.description = `This member has no logs.`;
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }



        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: `Use \`${guild.configurationManager.configuration.prefix}moderationlogs <user> [page number]\` to search thru pages. [1/${embedPages.length}]`
        };

        embedFields = embedPages[0];
        if (args.length == 2) {
            try {
                args[1] = parseInt(args[1]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`);
            }
            embed.footer = {
                text: `Use \`${guild.configurationManager.configuration.prefix}moderationlogs <user> [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
            };
            if (typeof embedPages[args[1] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
            embedFields = embedPages[args[1] - 1];
        }

        embedFields.forEach(embedField => {
            embed.addField(embedField[0], embedField[1], embedField[2]);
        });
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

function splitArrayIntoChunksOfLen(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}