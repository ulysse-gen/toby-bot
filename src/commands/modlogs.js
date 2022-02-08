const {
    MessageEmbed
} = require(`discord.js`);
const mysql = require("mysql");
const moment = require("moment");

const utils = require(`../utils`);

module.exports = {
    name: "moderationlogs",
    description: `Show the moderation logs of a member.`,
    aliases: ["modlogs", "whattheydidwrong"],
    permission: `commands.moderationlogs`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
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
            if (typeof user == "undefined") return utils.sendError(message, guild, `Could not get user data`, `User not found`);
        }
        if (args.length == 0) user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: `Moderation Log`,
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}.webp?size=64`
            }
        });



        let makeTheStats = new Promise((res, rej) => {
            let connection = mysql.createConnection(guild.moderationManager.sqlConfiguration);
            connection.connect();
            connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`userId\`='${user.user.id}'`, async function (error, results, fields) {
                connection.end();
                if (results.length == 0) {
                    res(false);
                }
                let control = results.length;
                results.reverse();
                results.forEach(modAction => {
                    embedFields.push([`**Case #${modAction.numId}**`, `**Type:** ${modAction.type}\n**User:** <@${user.user.id}>(${user.user.id})\n**Moderator:** <@${modAction.moderatorId}>(${modAction.moderatorId})\n**Reason:** ${modAction.reason}\n**Timestamp**: <t:${moment(modAction.timestamp).unix()}>${(modAction.type == "Mute" && modAction.status == "active") ? `\n**Expires:** <t:${moment(modAction.expires).unix()}>(<t:${moment(modAction.expires).unix()}:R>)` : ``}${(JSON.parse(modAction.messageHistory).length == 0) ? `` : `\n**Message history**: \`t!punishmenttranscript ${modAction.numId}\``}`, false]);
                    control--;
                    if (control <= 0) {
                        res(true);
                    }
                });
            });
        });
        await makeTheStats;

        if (embedFields.length == 0) {
            embed.description = `This member has no logs.`;
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }



        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: `Use \`${guild.configuration.prefix}moderationlogs <user> [page number]\` to search thru pages. [1/${embedPages.length}]`
        };

        embedFields = embedPages[0];
        if (args.length == 2) {
            try {
                args[1] = parseInt(args[1]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`);
            }
            embed.footer = {
                text: `Use \`${guild.configuration.prefix}moderationlogs <user> [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
            };
            if (typeof embedPages[args[1] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`);
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