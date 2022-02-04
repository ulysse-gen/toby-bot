const moment = require('moment');
const mysql = require('mysql');
const {
    MessageEmbed
} = require(`discord.js`);
const Logger = require(`../classes/Logger`);

//Loggers
const MainLog = new Logger();

module.exports = class moderationManager {
    constructor(client, globalGuilds, logTable = "logs") {
        this.sqlConfiguration = require('../../MySQL.json');
        this.sqlTable = logTable;
        this.client = client;
        this.globalGuilds = globalGuilds;
    }

    async log(guildId, type, userId, moderatorId, reason, length) {
        let zisse = this;
        if (typeof guildId != "string" || typeof type != "string" || typeof userId != "string" || typeof moderatorId != "string" | typeof reason != "string") return false;

        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        expireDate = expireDate.format(`YYYY-MM-DD HH:mm-ss`);

        let values = [guildId, type, userId, moderatorId, reason, expireDate, (typeof length == "number") ? `active` : (typeof length == "boolean") ? (length == false) ? "info" : "indefinite" : "indefinite"];
        let valueNames = ["guildId", "type", "userId", "moderatorId", "reason", "expires", "status"];

        let connection = mysql.createConnection(this.sqlConfiguration);
        connection.connect();
        let requestPromise = new Promise((res, rej) => {
            connection.query(`INSERT INTO \`moderationLogs\` (\`${valueNames.join('`,`')}\`) VALUES (?,?,?,?,?,?,?)`, values, async function (error, results, fields) {
                connection.end();
                if (results.affectedRows == 1) {
                    connection = mysql.createConnection(zisse.sqlConfiguration);
                    connection.connect();
                    connection.query(`UPDATE \`moderationLogs\` SET \`status\`='overwritten' WHERE \`userId\`='${userId}' AND \`guildId\`='${guildId}' AND \`type\`='${type}' AND (\`status\`='active' OR \`status\`='indefinite') AND NOT \`numId\`='${results.insertId}'`, async function (error, results, fields) {});
                    connection.end();
                    res(results.insertId);
                }
                if (error) res(false);
            });
        });
        let requestResult = await requestPromise;
        return requestResult;
    }

    async sendPunishEmbed(message, guild, type, caseId, user, moderatorId, reason, length) {
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let embed = new MessageEmbed({
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}.webp?size=64`
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
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
        }).catch(e => this.messageReplyFailLogger(message, guild, e));
        if (typeof guild != "undefined" && guild.configuration.moderation.logToChannel.status && guild.moderationLog.initialized) guild.moderationLog.channel.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).catch(e => this.messageReplyFailLogger(message, guild, e));
        return false;
    }

    async sendPlayerPunishment(message, guild, type, user, moderatorId, reason, length) {
        let expireDate = moment();
        if (typeof length == "number") expireDate.add(length, 'seconds');
        let embed = new MessageEmbed({
            color: guild.configuration.colors.error,
            description: (type == "Warn") ? `You have been warned in ${guild.guild.name}` : (type == "Kick") ? `You have been kicked from ${guild.guild.name}` : (type == "Ban") ? `You have been banned from ${guild.guild.name}` : (type == "Mute") ? `You have been muted in ${guild.guild.name}` : ``,
            author: {
                name: user.user.tag,
                iconURL: `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}.webp?size=64`
            }
        });
        embed.addField(`**Reason**`, `${(typeof reason == "string") ? reason : `No reason specified.`}`, false);
        if (typeof length != "boolean") embed.addField(`**Expires**`, (typeof length == "number") ? `<t:${moment(expireDate).unix()}>(<t:${moment(expireDate).unix()}:R>)` : (typeof length == "boolean" && !length) ? `N/A` : `Indefinite`, false);
        user.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
        }).catch(e => {
            this.messageReplyFailLogger(message, guild, e);
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
        let connection = mysql.createConnection(this.sqlConfiguration);
        connection.connect();
        let requestPromise = new Promise((res, rej) => {
            connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`userId\`='${userId}' AND \`type\`='${type}' AND \`guildId\`='${guildId}' AND (\`status\`='active' OR \`status\`='indefinite')`, async function (error, results, fields) {
                connection.end();
                if (error) res(false);
                if (results.length == 0) res(false);
                res(true);
            });
        });
        let requestResult = await requestPromise;
        return requestResult;
    }

    async checkForExpired() {
        let zisse = this;
        let connection = mysql.createConnection(this.sqlConfiguration);
        connection.connect();
        let requestPromise = new Promise(async (res, rej) => {
            connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`status\`='active'`, async function (error, results, fields) {
                connection.end();
                if (error) res(false);
                if (results.length <= 0) res(true);
                let control = results.length;
                results.forEach(async indPunishments => {
                    if (moment(indPunishments.expires).isBefore(moment())) {
                        await zisse.client.guilds.fetch(indPunishments.guildId).then(async fetchedGuild => {
                            if (indPunishments.type == "Ban") {
                                await fetchedGuild.bans.remove(indPunishments.userId, `Punishment expire. (Was banned for ${indPunishments.reason})`).then(async () => {
                                    connection = mysql.createConnection(zisse.sqlConfiguration);
                                    connection.connect();
                                    connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                    connection.end();
                                    MainLog.log(`Unbanned ${(await zisse.client.users.fetch(indPunishments.userId)).tag}(${indPunishments.userId}). Punishment expired`);
                                }).catch(e => {
                                    if (e.toString() == "DiscordAPIError: Unknown Member") {
                                        connection = mysql.createConnection(zisse.sqlConfiguration);
                                        connection.connect();
                                        connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                        connection.end();
                                        MainLog.log(`Member ${indPunishments.userId} left, expiring punishment. ${e.toString()}`);
                                    } else {
                                        MainLog.log(`Could not unban ${indPunishments.userId}. ${e.toString()}`);
                                    }
                                });
                            }
                            if (indPunishments.type == "Mute" && typeof zisse.globalGuilds.guilds[indPunishments.guildId] != "undefined") {
                                let muteRole = zisse.globalGuilds.guilds[indPunishments.guildId].configuration.moderation.muteRole;
                                await fetchedGuild.roles.fetch(muteRole).then(async fetchedRole => {
                                    await fetchedGuild.members.fetch(indPunishments.userId).then(async fetchedMember => {
                                        await fetchedMember.roles.remove(fetchedRole, `Punishment expire. (Was muted for ${indPunishments.reason})`).then(async () => {
                                            connection = mysql.createConnection(zisse.sqlConfiguration);
                                            connection.connect();
                                            connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                            connection.end();
                                            MainLog.log(`Unmuted ${(fetchedMember.user.tag)}(${indPunishments.userId}). Punishment expired`);
                                        }).catch(e => console.log(`moderationManager.js could not unmute ${indPunishments.userId} (${e.toString()})`));
                                    }).catch(e => {
                                        if (e.toString() == "DiscordAPIError: Unknown Member") {
                                            connection = mysql.createConnection(zisse.sqlConfiguration);
                                            connection.connect();
                                            connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                            connection.end();
                                            MainLog.log(`Member ${indPunishments.userId} left, expiring punishment. ${e.toString()}`);
                                        } else {
                                            MainLog.log(`Could not unmute ${indPunishments.userId}. ${e.toString()}`);
                                        }
                                    });
                                }).catch(e => console.log(`moderationManager.js could not fetch role for ${indPunishments.userId} (${e.toString()})`));
                            }
                        }).catch(e => console.log(`moderationManager.js could not fetch guild ${zisse.globalGuilds.guilds[indPunishments.guildId]} (${e.toString()})`));
                    }
                    control++;
                    if (control <= 0) res(true);
                });
            });
        });
        let requestResult = await requestPromise;
        return requestResult;
    }
}