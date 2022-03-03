const {
    MessageEmbed
} = require(`discord.js`);
const mysql = require("mysql");
const moment = require("moment");
const urlExists = require('url-exists');
const {
    configuration
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "moderationstats",
    description: `Show the moderation stats of a moderator.`,
    aliases: ["modstats", "howgoodisthismoderator"],
    permission: `commands.moderationstats`,
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
            if (typeof user == "undefined") return utils.sendError(message, guild, `Could not get moderator data`, `User not found`, [], true); /*Updated To New Utils*/
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
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });



        let makeTheStats = new Promise((res, rej) => {
            let stats = {
                sevenDays: {
                    mutes: 0,
                    bans: 0,
                    kicks: 0,
                    warns: 0
                },
                thirtyDays: {
                    mutes: 0,
                    bans: 0,
                    kicks: 0,
                    warns: 0
                },
                allTime: {
                    mutes: 0,
                    bans: 0,
                    kicks: 0,
                    warns: 0
                }
            }
            guild.moderationManager.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`moderatorId\`='${user.user.id}'`, async function (error, results, fields) {
                    if (results.length == 0) {
                        try { connection.release() } catch (e) {}
                        res(stats);
                    }
                    let control = results.length;
                    results.forEach(modAction => {
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.status != "deleted"){
                            if (modAction.type == "Mute") {
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.mutes++;
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.mutes++;
                                stats.allTime.mutes++;
                            }
                            if (modAction.type == "Ban") {
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.bans++;
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.bans++;
                                stats.allTime.bans++;
                            }
                            if (modAction.type == "Kick") {
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.kicks++;
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.kicks++;
                                stats.allTime.kicks++;
                            }
                            if (modAction.type == "Warn") {
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.warns++;
                                if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.warns++;
                                stats.allTime.warns++;
                            }
                        }
                        control--;
                        if (control <= 0) {
                            try { connection.release() } catch (e) {}
                            res(stats);
                        }
                        try { connection.release() } catch (e) {}
                        if (error) {
                            ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                            res(stats);
                        }
                        res(stats);
                    });
                });
            });
        });
        let stats = await makeTheStats;


        embed.addField(`**Mutes (last 7 days):**`, `${stats.sevenDays.mutes}`, true);
        embed.addField(`**Mutes (last 30 days):**`, `${stats.thirtyDays.mutes}`, true);
        embed.addField(`**Mutes (all time):**`, `${stats.allTime.mutes}`, true);
        embed.addField(`**Bans (last 7 days):**`, `${stats.sevenDays.bans}`, true);
        embed.addField(`**Bans (last 30 days):**`, `${stats.thirtyDays.bans}`, true);
        embed.addField(`**Bans (all time):**`, `${stats.allTime.bans}`, true);
        embed.addField(`**Kicks (last 7 days):**`, `${stats.sevenDays.kicks}`, true);
        embed.addField(`**Kicks (last 30 days):**`, `${stats.thirtyDays.kicks}`, true);
        embed.addField(`**Kicks (all time):**`, `${stats.allTime.kicks}`, true);
        embed.addField(`**Warns (last 7 days):**`, `${stats.sevenDays.warns}`, true);
        embed.addField(`**Warns (last 30 days):**`, `${stats.thirtyDays.warns}`, true);
        embed.addField(`**Warns (all time):**`, `${stats.allTime.warns}`, true);
        embed.addField(`**Total (last 7 days):**`, `${stats.sevenDays.mutes + stats.sevenDays.bans + stats.sevenDays.kicks + stats.allTime.warns}`, true);
        embed.addField(`**Total (last 30 days):**`, `${stats.thirtyDays.mutes + stats.thirtyDays.bans + stats.thirtyDays.kicks + stats.allTime.warns}`, true);
        embed.addField(`**Total (all time):**`, `${stats.allTime.mutes + stats.allTime.bans + stats.allTime.kicks + stats.allTime.warns}`, true);
        if (user.user.id == "280063634477154306")embed.addField(`**Important infos:**`, `Whatever the stats can be, Kilo is still a very bad mod.`, true); //Kilo
        if (user.user.id == "737886546182799401")embed.addField(`**Important infos:**`, `Wait hm.. I’m not a kitten.`, true);   //Flair
        if (user.user.id == "899655742389358612")embed.addField(`**Important infos:**`, `huh?`, true);   //Olle
        if (user.user.id == "762760262683459654")embed.addField(`**Important infos:**`, `I’m very indecisive so could you make one up for me?`, true);   //Aiko
        if (user.user.id == "913934813524799490")embed.addField(`**Important infos:**`, `The original sebs badge creator.`, true);   //Sebs
        if (user.user.id == "408726936286658561")embed.addField(`**Important infos:**`, `<:teddy_bear:945443955263303750>`, true);   //Bassie
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