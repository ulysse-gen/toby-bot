const moment = require('moment');
const mysql = require('mysql');
const urlExists = require('url-exists');
const axios = require('axios');
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

        this.scamLinks = undefined;
        this.scamterms = undefined;
        this.scamSlashes = undefined;
        this.refreshDataSets();

        setInterval(() => this.refreshDataSets(), 43200000); //Scan toutes les 12H
    }

    async log(guildId, type, userId, moderatorId, reason, length) {
        let zisse = this;
        if (typeof guildId != "string" || typeof type != "string" || typeof userId != "string" || typeof moderatorId != "string" || typeof reason != "string") return false;

        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        expireDate = expireDate.format(`YYYY-MM-DD HH:mm-ss`);

        let values = [guildId, type, userId, moderatorId, reason, expireDate, (typeof length == "number") ? `active` : (typeof length == "boolean") ? (length == false) ? "info" : "indefinite" : "indefinite", (typeof this.globalGuilds.guilds[guildId].lastMessages[userId] != "undefined" ? JSON.stringify(this.globalGuilds.guilds[guildId].lastMessages[userId]) : "[]")];
        let valueNames = ["guildId", "type", "userId", "moderatorId", "reason", "expires", "status", "messageHistory"];

        return new Promise((res, rej) => {
            zisse.sqlPool.query(`INSERT INTO \`moderationLogs\` (\`${valueNames.join('`,`')}\`) VALUES (?,?,?,?,?,?,?,?)`, values, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(null);
                }
                if (results.affectedRows != 1) {
                    ErrorLog.log(`Could not insert punishment. [${zisse.sqlTable} => ${zisse.sqlWhere}]`);
                    res(false);
                }
                if (type == "Mute" || type == "Ban" || type == "Sticky") zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='overwritten' WHERE \`userId\`='${userId}' AND \`guildId\`='${guildId}' AND \`type\`='${type}' AND (\`status\`='active' OR \`status\`='indefinite' OR \`status\`='info') AND NOT \`numId\`='${results.insertId}'`);
                res(results.insertId);
            });
        });
    }

    async sendPunishEmbed(message, guild, type, caseId, user, moderatorId, reason, length, silent = false) {
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let userPFP = await getUserPfp(user);
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
        if (!silent)message.channel.send({
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        }).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        if (typeof guild != "undefined" && guild.configuration.moderation.logToChannel.status && guild.moderationLog.initialized) guild.moderationLog.channel.send({ 
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        return false;
    }

    async sendAutoModEmbed(message, guild, trigger, actionTaken, user, reason = [], alert = false) {
        reason = reason.filter(function (e) {
            return (typeof e != "undefined" && e !== '')
        });
        reason = reason.map(e => {
            if (typeof e == "string") return e.trim()
        });
        if (typeof actionTaken != "string" || actionTaken == "") return false;
        if (typeof trigger != "string" || trigger == "") return false;
        if (reason.length == 0) return false;
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let userPFP = await getUserPfp(user);
        let embed = new MessageEmbed({
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });
        embed.addField(`**Trigger**`, `${trigger}`, true);
        embed.addField(`**Action(s) Taken**`, `${actionTaken}`, true);
        embed.addField(`**User**`, `<@${user.user.id}>`, true);
        embed.addField(`**Channel**`, `<#${message.channel.id}>`, true);
        embed.addField(`**Detected**`, `||${reason.join(`||, ||`)}||`, true);
        embed.addField(`**Infos**`, `ID: ${user.user.id} • <t:${moment().unix()}>`, false);
        let messageContent = {
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        };
        if (alert && guild.configuration.moderation.autoModeration.staffRoleForAlert.length != 0)messageContent.content = `<@&${guild.configuration.moderation.autoModeration.staffRoleForAlert.join("> <@&")}>`;
        if (typeof guild != "undefined" && guild.configuration.moderation.autoModeration.channel.status && guild.autoModerationLog.initialized) guild.autoModerationLog.channel.send(messageContent, false).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        return true;
    }

    async sendPlayerPunishment(message, guild, type, user, _moderatorId, reason, length) {
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let userPFP = await getUserPfp(user);
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
            if (e.code == 50007) message.channel.send(`Could not send message to this user.`);
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
        return new Promise((res, _rej) => {
            zisse.sqlPool.query(`SELECT * FROM \`moderationLogs\` WHERE \`userId\`='${userId}' AND \`type\`='${type}' AND \`guildId\`='${guildId}' AND (\`status\`='active' OR \`status\`='indefinite')`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(null);
                }
                if (results.length == 0) res(false);
                res(true);
            });
        });
    }

    async getPunishementByCaseId(caseId, guildId) {
        let zisse = this;
        return new Promise((res, rej) => {
            zisse.sqlPool.query(`SELECT * FROM \`moderationLogs\` WHERE \`numId\`='${caseId}' AND \`guildId\`='${guildId}'`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(null);
                }
                if (results.length == 0) res(false);
                res(results[0]);
            });
        });
    }

    async deletePunishment(message, caseId, reason) {
        let zisse = this;
        return new Promise((res, _rej) => {
            zisse.sqlPool.query(`SELECT * FROM \`moderationLogs\` WHERE \`numId\`=${caseId} AND \`guildId\`='${message.channel.guild.id}'`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(null);
                }
                if (typeof results == "undefined" || results.length == 0 || typeof results[0] == "undefined" || results[0].status == "deleted")return res({
                    error: `Punishment not found.`
                });
                if (["Mute", "Ban"].includes(results[0].type) && ["active","indefinite"].includes(results[0].status)) {
                    if (moment(results[0].expires).isAfter(moment()) || results[0].status == "indefinite")return res({
                        error: `This punishment isnt expired yet. ${(results[0].type == "Mute") ? `Unmute` : `Unban`} then delete the punishment.`
                    });
                }
                zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='deleted', \`updaterId\`='${message.author.id}', \`updateReason\`='${reason}', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${caseId}`);
                res(true);
            });
        });
    }

    async refreshDataSets() {
        this.scamLinks = await axios.get('https://spen.tk/api/v1/links')
            .then(response => {
                return response.data.links
            })
            .catch(_error => {
                return [];
            });
        this.scamterms = await axios.get('https://spen.tk/api/v1/terms')
            .then(response => {
                return response.data.terms
            })
            .catch(_error => {
                return [];
            });
        this.scamSlashes = await axios.get('https://spen.tk/api/v1/slashes')
            .then(response => {
                return response.data.slashes
            })
            .catch(_error => {
                return [];
            });
        //MainLog.log(`Loaded autoMod datasets.`);
    }
}

async function getUserPfp(user) {
    if (typeof user == "undefined" || (typeof user.user.avatar == "undefined" && typeof user.avatar == "undefined")) return `https://tobybot.ubd.ovh/assets/imgs/default_discord_avatar.png`;
    return new Promise((res, _rej) => {
        let urlBase = (user.avatar != null) ? `https://cdn.discordapp.com/guilds/${user.guild.id}/users/${user.user.id}/avatars/${user.avatar}` : `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}`;
        urlExists(`${urlBase}.gif`, function (_err, exists) {
            res((exists) ? `${urlBase}.gif` : `${urlBase}.webp`);
        });
    });
}