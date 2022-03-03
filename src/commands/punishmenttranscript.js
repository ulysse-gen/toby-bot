const {
    MessageEmbed
} = require(`discord.js`);
const moment = require("moment");

const utils = require(`../utils`);

module.exports = {
    name: "punishmenttranscript",
    description: `Show message transcript from a punishment by case ID.`,
    aliases: ["punishtranscript", "pt"],
    permission: `commands.punishmenttranscript`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        let user = undefined;

        if (args.length == 0) return utils.sendError(message, guild, `No case ID specified.`, undefined, [], true); /*Updated To New Utils*/

        let punishmentInfos = await guild.moderationManager.getPunishementByCaseId(args[0], guild.guild.id);
        if (typeof punishmentInfos == "undefined") return utils.sendError(message, guild, `Could not find punishement.`, undefined, [], true); /*Updated To New Utils*/
        if (punishmentInfos == false) return utils.sendError(message, guild, `Could not find punishement.`, undefined, [], true); /*Updated To New Utils*/
        user = await message.channel.guild.members.fetch(punishmentInfos.userId, {
            cache: false,
            force: true
        }).catch(e => {
            return {
                user: {
                    id: punishmentInfos.userId
                }
            };
        });

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: `Last messages - ${(typeof user.user.tag != "undefined") ? user.user.tag : user.user.id}`,
            color: guild.configuration.colors.main,
            description: `Last messages from <@${user.user.id}> before the ${punishmentInfos.type.toLowerCase()}`
        });

        let messageHistory;
        try {
            messageHistory = JSON.parse(punishmentInfos.messageHistory);
        } catch (e) {
            return utils.sendError(message, guild, `An error occured trying to parse the message history.`, undefined, [], true); /*Updated To New Utils*/
        }

        if (typeof messageHistory == "undefined" || messageHistory.length == 0) return utils.sendError(message, guild, `No messages saved.`, undefined, [], true); /*Updated To New Utils*/

        messageHistory.forEach(indMessage => {
            let fieldBody = `Content: ${indMessage.content}\nAttachments : ${(indMessage.attachments.length == 0) ? `None` : `[**URL**](${indMessage.attachments.join(`) [**URL**](`)})`}\nStickers : ${(typeof indMessage.stickers == "undefined" || indMessage.stickers.length == 0) ? `None` : `[**URL**](${indMessage.stickers.join(`) [**URL**](`)})`}\nSent in : <#${indMessage.channelId}>\nSent at : <t:${moment(indMessage.createdTimestamp).unix()}>`;
            if (fieldBody.length > 1024) fieldBody = `Content: ${indMessage.content.trimEllip(1021-fieldBody.replace(indMessage.content, ``).length)}\nAttachments : ${(indMessage.attachments.length == 0) ? `None` : `[**URL**](${indMessage.attachments.join(`) [**URL**](`)})`}\nStickers : ${(typeof indMessage.stickers == "undefined" || indMessage.stickers.length == 0) ? `None` : `[**URL**](${indMessage.stickers.join(`) [**URL**](`)})`}\nSent in : <#${indMessage.channelId}>\nSent at : <t:${moment(indMessage.createdTimestamp).unix()}>`;
            embedFields.push([`**Message Entry**`, `${fieldBody}`, false]);
        });

        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: `Use \`${guild.configuration.prefix}punishmenttranscript <caseId> [page number]\` to search thru pages. [1/${embedPages.length}]`
        };

        embedFields = embedPages[0];
        if (args.length == 2) {
            try {
                args[1] = parseInt(args[1]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`, undefined, [], true); /*Updated To New Utils*/
            }
            embed.footer = {
                text: `Use \`${guild.configuration.prefix}punishmenttranscript <caseId> [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
            };
            if (typeof embedPages[args[1] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`, undefined, [], true); /*Updated To New Utils*/
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
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
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