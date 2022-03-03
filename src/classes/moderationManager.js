const moment = require('moment');
const mysql = require('mysql');
const urlExists = require('url-exists');
const {
    MessageEmbed
} = require(`discord.js`);
const Logger = require(`../classes/Logger`);

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class moderationManager {
    constructor(client, globalGuilds, logTable = "logs") {
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
        this.sqlTable = logTable;
        this.client = client;
        this.globalGuilds = globalGuilds;

        this.auto = {
            status: true,
            violationsArray: [],
            type: `logonly`, //logonly, punishonly, logandpunish
            punish: `none` //none, delete, warn, strike(soon), mute, kick, ban
        }
    }

    async log(guildId, type, userId, moderatorId, reason, length) {
        let zisse = this;
        if (typeof guildId != "string" || typeof type != "string" || typeof userId != "string" || typeof moderatorId != "string" | typeof reason != "string") return false;

        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        expireDate = expireDate.format(`YYYY-MM-DD HH:mm-ss`);

        let values = [guildId, type, userId, moderatorId, reason, expireDate, (typeof length == "number") ? `active` : (typeof length == "boolean") ? (length == false) ? "info" : "indefinite" : "indefinite", (typeof this.globalGuilds.guilds[guildId].lastMessages[userId] != "undefined" ? JSON.stringify(this.globalGuilds.guilds[guildId].lastMessages[userId]) : "[]")];
        let valueNames = ["guildId", "type", "userId", "moderatorId", "reason", "expires", "status", "messageHistory"];

        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`INSERT INTO \`moderationLogs\` (\`${valueNames.join('`,`')}\`) VALUES (?,?,?,?,?,?,?,?)`, values, async function (error, results, fields) {
                    if (results.affectedRows == 1) {
                        connection.query(`UPDATE \`moderationLogs\` SET \`status\`='overwritten' WHERE \`userId\`='${userId}' AND \`guildId\`='${guildId}' AND \`type\`='${type}' AND (\`status\`='active' OR \`status\`='indefinite') AND NOT \`numId\`='${results.insertId}'`, async function (error, results, fields) {});
                        res(results.insertId);
                    }
                    try {
                        connection.release()
                    } catch (e) {}
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                    }
                    res(false);
                });
            });
        });
    }

    async sendPunishEmbed(message, guild, type, caseId, user, moderatorId, reason, length) {
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let userPFP = await utils.getUserPfp(user);
        let embed = new MessageEmbed({
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });
        embed.addField(`**Case**`, `#${caseId}`, true);
        embed.addField(`**Type**`, `${type}`, true);
        embed.addField(`**User**`, `<@${user.user.id}>`, true);
        embed.addField(`**Moderator**`, `<@${moderatorId}>`, true);
        embed.addField(`**Reason**`, `${(typeof reason == "string") ? reason : `No reason specified.`}`, true);
        if (typeof length != "boolean") embed.addField(`**Expires**`, (typeof length == "number") ? `<t:${moment(expireDate).unix()}>(<t:${moment(expireDate).unix()}:R>)` : (typeof length == "boolean" && !length) ? `N/A` : `Indefinite`, true);
        embed.addField(`**Infos**`, `ID: ${user.user.id} • <t:${moment().unix()}>`, false);
        message.channel.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        }).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        if (typeof guild != "undefined" && guild.configuration.moderation.logToChannel.status && guild.moderationLog.initialized) guild.moderationLog.channel.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        return false;
    }

    async sendAutoModEmbed(message, guild, trigger, check, user, reason) {
        reason = reason.filter(function (e) {
            return (typeof e != "undefined" && e !== '')
        });
        reason = reason.map(e => {
            if (typeof e == "string") return e.trim()
        });
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let userPFP = await utils.getUserPfp(user);
        let embed = new MessageEmbed({
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });
        embed.addField(`**Trigger**`, `${trigger}`, true);
        embed.addField(`**Check**`, `${check}`, true);
        embed.addField(`**User**`, `<@${user.user.id}>`, true);
        embed.addField(`**Channel**`, `<#${message.channel.id}>`, true);
        embed.addField(`**Detected**`, `||${reason.join(`||, ||`)}||`, true);
        embed.addField(`**Infos**`, `ID: ${user.user.id} • <t:${moment().unix()}>`, false);
        if (typeof guild != "undefined" && guild.configuration.moderation.autoModeration.channel.status && guild.autoModerationLog.initialized) guild.autoModerationLog.channel.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        return false;
    }

    async sendPlayerPunishment(message, guild, type, user, moderatorId, reason, length) {
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let userPFP = await utils.getUserPfp(user);
        let embed = new MessageEmbed({
            color: guild.configuration.colors.error,
            description: (type == "Warn") ? `You have been warned in ${guild.guild.name}` : (type == "Kick") ? `You have been kicked from ${guild.guild.name}` : (type == "Ban") ? `You have been banned from ${guild.guild.name}` : (type == "Mute") ? `You have been muted in ${guild.guild.name}` : ``,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });
        embed.addField(`**Reason**`, `${(typeof reason == "string") ? reason : `No reason specified.`}`, false);
        if (typeof length != "boolean") embed.addField(`**Expires**`, (typeof length == "number") ? `<t:${moment(expireDate).unix()}>(<t:${moment(expireDate).unix()}:R>)` : (typeof length == "boolean" && !length) ? `N/A` : `Indefinite`, false);
        user.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        }).catch(e => {
            ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`)
            if (e.code == 50007)message.channel.send(`Could not send message to this user.`);
            return {
                errored: true,
                reason: e
            };
        });
        return {
            errored: false
        };
    }

    async isUserPunished(userId, guildId, type) {
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`userId\`='${userId}' AND \`type\`='${type}' AND \`guildId\`='${guildId}' AND (\`status\`='active' OR \`status\`='indefinite')`, async function (error, results, fields) {
                    if (results.length == 0) {
                        try {
                            connection.release()
                        } catch (e) {}
                        res(false);
                    }
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
    }

    async getPunishementByCaseId(caseId, guildId) {
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`numId\`='${caseId}' AND \`guildId\`='${guildId}'`, async function (error, results, fields) {
                    if (results.length == 0) {
                        try {
                            connection.release()
                        } catch (e) {}
                        res(false);
                    }
                    try {
                        connection.release()
                    } catch (e) {}
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                    res(results[0]);
                });
            });
        });
    }

    async deletePunishment(message, caseId, reason) {
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`numId\`=${caseId} AND \`guildId\`='${message.channel.guild.id}'`, async function (error, results, fields) {
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res({error: `An error occured getting the punishment from the database.`});
                    }if (typeof results == "undefined" || results.length == 0 || results[0].status == "deleted")res({error: `Punishment not found.`});
                    if ((results[0].type == "Mute" || results[0].type == "Ban") && results[0].status == "active"){
                        if (moment(results[0].expires).isAfter(moment())) {
                            res({error:`This punishment isnt expired yet. ${(results[0].type == "Mute") ? `Unmute` : `Unban`} then delete the punishment.`});
                        }
                    }
                    connection.query(`UPDATE \`moderationLogs\` SET \`status\`='deleted', \`updaterId\`='${message.author.id}', \`updateReason\`='${reason}', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${caseId}`, async function (error, results, fields) {});
                    connection.release();
                    res(true);
                });
            });
        });
    }
}