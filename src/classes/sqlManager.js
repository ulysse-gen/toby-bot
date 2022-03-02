const mysql = require('mysql');
const moment = require('moment');

const Logger = require(`../classes/Logger`);

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class sqlManager {
    constructor(client, globalCommands, globalPermissions, globalGuilds) {
        this.client = client;
        this.globalCommands = globalCommands;
        this.globalPermissions = globalPermissions;
        this.globalGuilds = globalGuilds;
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
    }

    async checkForExpiredModeration() {
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`moderationLogs\` WHERE \`status\`='active'`, async function (error, results, fields) {
                    let control = results.length;
                    if (typeof results != "undefined" || results.length != 0) results.forEach(async indPunishments => {
                        if (moment(indPunishments.expires).isBefore(moment())) {
                            await zisse.client.guilds.fetch(indPunishments.guildId).then(async fetchedGuild => {
                                if (indPunishments.type == "Ban") {
                                    await fetchedGuild.bans.remove(indPunishments.userId, `Punishment expire. (Was banned for ${indPunishments.reason})`).then(async () => {
                                        connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                        MainLog.log(`Unbanned ${(await zisse.client.users.fetch(indPunishments.userId)).tag}(${indPunishments.userId}). Punishment expired`);
                                    }).catch(e => {
                                        if (e.toString() == "DiscordAPIError: Unknown Member") {
                                            connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
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
                                                connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                                MainLog.log(`Unmuted ${(fetchedMember.user.tag)}(${indPunishments.userId}). Punishment expired`);
                                            }).catch(e => console.log(`sqlManager.js could not unmute ${indPunishments.userId} (${e.toString()})`));
                                        }).catch(e => {
                                            if (e.toString() == "DiscordAPIError: Unknown Member") {
                                                connection.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`, async function (error, results, fields) {});
                                                MainLog.log(`Member ${indPunishments.userId} left, expiring punishment. ${e.toString()}`);
                                            } else {
                                                MainLog.log(`Could not unmute ${indPunishments.userId}. ${e.toString()}`);
                                            }
                                        });
                                    }).catch(e => console.log(`sqlManager.js could not fetch role for ${indPunishments.userId} (${e.toString()})`));
                                }
                            }).catch(e => console.log(`sqlManager.js could not fetch guild ${zisse.globalGuilds.guilds[indPunishments.guildId]} (${e.toString()})`));
                        }
                        control++;
                        if (control <= 0) {
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
    }

    /*async checkForReminders() {
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM \`reminders\` WHERE \`status\`='active'`, async function (error, results, fields) {
                    let control = results.length;
                    if (typeof results != "undefined" || results.length != 0) results.forEach(async indReminer => {
                        if (moment(indReminer.timestamp).isBefore(moment())) {
                            await zisse.client.guilds.fetch(indReminer.guildId).then(async fetchedGuild => {
                                
                            }).catch(e => console.log(`sqlManager.js could not fetch guild ${zisse.globalGuilds.guilds[indPunishments.guildId]} (${e.toString()})`));
                        }
                        control++;
                        if (control <= 0) {
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
    }*/
}