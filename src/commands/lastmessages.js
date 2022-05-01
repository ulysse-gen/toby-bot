const {
    MessageEmbed
} = require(`discord.js`);
const moment = require("moment");

const utils = require(`../utils`);

module.exports = {
    name: "lastmessages",
    description: `Show 25 last messages of a member.`,
    aliases: ["messagehistory"],
    permission: `commands.lastmessages`,
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
            if (typeof user == "undefined") user = {user: {id: args[0]}};
        }
        if (args.length == 0) user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        if (typeof user == "undefined") return utils.sendError(message, guild, `User not found.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: `Last messages - ${(typeof user.user.tag != "undefined") ? user.user.tag : user.user.id}`,
            color: guild.configurationManager.configuration.colors.main
        });

        if (typeof guild.lastMessages[user.user.id] == "undefined" || guild.lastMessages[user.user.id].length == 0) return utils.sendError(message, guild, `No messages in cache.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
    
        guild.lastMessages[user.user.id].forEach(indMessage => {
            embedFields.push([`**Message Entry**`, `Content: ${indMessage.content}\nAttachments : ${(indMessage.attachments.length == 0) ? `None` : `[**URL**](${indMessage.attachments.join(`) [**URL**](`)})`}\nSent in : <#${indMessage.channelId}>\nSent at : <t:${moment(indMessage.createdTimestamp).unix()}>`, false]);
        });

        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: `Use \`${guild.configurationManager.configuration.prefix}lastmessages <user> [page number]\` to search thru pages. [1/${embedPages.length}]`
        };

        embedFields = embedPages[0];
        if (args.length == 2) {
            try {
                args[1] = parseInt(args[1]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
            }
            embed.footer = {
                text: `Use \`${guild.configurationManager.configuration.prefix}lastmessages <user> [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
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