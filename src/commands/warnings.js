const {
    MessageEmbed
} = require(`discord.js`);
const mysql = require("mysql");
const urlExists = require('url-exists');
const moment = require("moment");

const utils = require(`../utils`);

module.exports = {
    name: "warnings",
    description: `List the warnings for a user.`,
    aliases: ["warns"],
    permission: `commands.warnings`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        let user = undefined;

        if (args.length != 0) {
            user = await guild.grabUser(message, args[0]);
            if (typeof user == "undefined") user = {id: args[0], user: {id: args[0], tag: `Unknown#Tag`}};
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
            title: `Notes`,
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });

        let makeTheStats = new Promise((res, rej) => {
            guild.moderationManager.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`userId\`='${user.user.id}' AND status!='deleted' AND type='Warn'`, async function (error, results, fields) {
                    if (results.length == 0) {
                        try {
                            connection.release()
                        } catch (e) {}
                        res(false);
                    }
                    let control = results.length;
                    results.reverse();
                    results.forEach(modAction => {
                        if (!modAction.reason.startsWith('[RR Auto]'))embedFields.push([`**Case #${modAction.numId}**`, `**Type:** ${modAction.type}\n**User:** <@${user.user.id}>(${user.user.id})\n**Moderator:** <@${modAction.moderatorId}>(${modAction.moderatorId})\n**Reason:** ${modAction.reason}\n**Timestamp**: <t:${moment(modAction.timestamp).unix()}>${(modAction.type == "Mute" && modAction.status == "active") ? `\n**Expires:** <t:${moment(modAction.expires).unix()}>(<t:${moment(modAction.expires).unix()}:R>)` : ``}${(JSON.parse(modAction.messageHistory).length == 0) ? `` : `\n**Message history**: \`t!punishmenttranscript ${modAction.numId}\``}`, false]);
                        control--;
                        if (control <= 0) {
                            try {
                                connection.release()
                            } catch (e) {}
                            res(true);
                        }
                    });
                    try {
                        connection.release()
                    } catch (e) {}
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                    res(true);
                });
            });
        });
        await makeTheStats;

        if (embedFields.length == 0) {
            embed.description = `This member has no warnings.`;
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
            text: `Use \`${guild.configuration.prefix}warnings <user> [page number]\` to search thru pages. [1/${embedPages.length}]`
        };

        embedFields = embedPages[0];
        if (args.length == 2) {
            try {
                args[1] = parseInt(args[1]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`, undefined, [], true); /*Updated To New Utils*/
            }
            embed.footer = {
                text: `Use \`${guild.configuration.prefix}warnings <user> [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
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