const mysql = require('mysql');
const moment = require('moment');
const crypto = require('crypto');
const {
    MessageEmbed
} = require(`discord.js`);

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
        return new Promise((res, _rej) => {
            zisse.sqlPool.query(`SELECT * FROM \`moderationLogs\` WHERE \`status\`='active'`, async (error, results, _fields) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(null);
                }
                if (typeof results != "undefined" && results != null && results.length != 0) {
                    let control = results.length;
                    results.forEach(async indPunishments => {
                        if (moment(indPunishments.expires).isBefore(moment())) {
                            await zisse.client.guilds.fetch(indPunishments.guildId).then(async fetchedGuild => {
                                if (indPunishments.type == "Ban") {
                                    await fetchedGuild.bans.remove(indPunishments.userId, `Punishment expire. (Was banned for ${indPunishments.reason})`).then(async () => {
                                        zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`);
                                        MainLog.log(`Unbanned ${(await zisse.client.users.fetch(indPunishments.userId)).tag}(${indPunishments.userId}). Punishment expired`);
                                    }).catch(e => errorHandler(e, (e) => console.log("2", e)));
                                }
                                if (indPunishments.type == "Mute" && typeof zisse.globalGuilds.guilds[indPunishments.guildId] != "undefined") {
                                    let muteRole = zisse.globalGuilds.guilds[indPunishments.guildId].configurationManager.configuration.moderation.muteRole;
                                    await fetchedGuild.roles.fetch(muteRole).then(async fetchedRole => {
                                        await fetchedGuild.members.fetch(indPunishments.userId).then(async fetchedMember => {
                                            await fetchedMember.roles.remove(fetchedRole, `Punishment expire. (Was muted for ${indPunishments.reason})`).then(async () => {
                                                zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`);
                                                MainLog.log(`Unmuted ${(fetchedMember.user.tag)}(${indPunishments.userId}). Punishment expired`);
                                            }).catch(e => errorHandler(e, (e) => {
                                                if (!e.fatal)zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`);
                                                if (e.code == 100) {
                                                    ErrorLog.log(`Could not fetch the mute role, the mute role should be defined again. [Guild ${indPunishments.guildId}]`);
                                                } else {
                                                    console.log("1", e);
                                                }
                                            }));
                                        }).catch(e => errorHandler(e, (e) => {
                                            if (!e.fatal)zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`);
                                            if (e.code == 404) {
                                                ErrorLog.log(`Could not fetch the member to unmute. [Guild ${indPunishments.guildId}]`);
                                            } else {
                                                console.log("2", e);
                                            }
                                        }));
                                    }).catch(e => errorHandler(e, (e) => {
                                        if (!e.fatal)zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`);
                                        if (e.code == 100) {
                                            ErrorLog.log(`Could not fetch the mute role, the mute role should be defined again. [Guild ${indPunishments.guildId}]`);
                                        } else {
                                            console.log("3", e);
                                        }
                                    }));
                                }
                            }).catch(e => errorHandler(e, (e) => {
                                if (e.code == 100) {
                                    ErrorLog.log(`Could not fetch the guild with this ID. [sqlManager]`);
                                } else {
                                    console.log("4", e);
                                }
                            }));
                        }
                        control++;
                        if (control <= 0) res(true);
                    });
                }
            })
        });
    }

    async checkForReminders() {
        let zisse = this;
        return this.sqlPool.getConnection((err, connection) => {
            if (err) {
                ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                return false;
            }
            connection.query(`SELECT * FROM \`reminders\` WHERE \`status\`='active'`, async function (error, results, fields) {
                let control = results.length;
                if (typeof results != "undefined" && results != null && results.length != 0) results.forEach(async indReminer => {
                    if (moment(indReminer.timestamp).isBefore(moment())) {
                        await zisse.client.guilds.fetch(indReminer.guildId).then(async fetchedGuild => {
                            await fetchedGuild.members.fetch(indReminer.userId).then(async fetchedMember => {
                                await fetchedGuild.channels.fetch(indReminer.channelId).then(async fetchedChannel => {
                                    let reminderData = JSON.parse(indReminer.content)
                                    let embed = new MessageEmbed({
                                        title: `Reminder !`,
                                        color: (typeof zisse.globalGuilds.guilds[indReminer.guildId] != "undefined") ? zisse.globalGuilds.guilds[indReminer.guildId].configurationManager.configuration.colors.main : `#FFFFFF`,
                                        description: `${reminderData.text}`
                                    });
                                    embed.addField(`**Created**`, `<t:${moment(indReminer.createdTimestamp).unix()}>`, true);
                                    embed.addField(`**Set to**`, `<t:${moment(indReminer.timestamp).unix()}>`, true);
                                    connection.query(`UPDATE \`reminders\` SET \`status\`='expired' WHERE \`numId\`=${indReminer.numId}`, async function (error, results, fields) {});
                                    MainLog.log(`Reminded ${fetchedMember.user.tag}(${indReminer.userId}).`);
                                    fetchedChannel.send({
                                        content: `<@${fetchedMember.user.id}>`,
                                        embeds: [embed]
                                    }, false).catch(e => utils.messageReplyFailLogger(message, guild, e));
                                    return true;
                                }).catch(e => console.log(`sqlManager.js could not fetch channel ${zisse.globalGuilds.guilds[indReminer.guildId]} (${e.toString()})`));
                            }).catch(e => console.log(`sqlManager.js could not fetch member ${zisse.globalGuilds.guilds[indReminer.guildId]} (${e.toString()})`));
                        }).catch(e => console.log(`sqlManager.js could not fetch guild ${zisse.globalGuilds.guilds[indReminer.guildId]} (${e.toString()})`));
                    }
                    control++;
                    if (control <= 0) {
                        return true;
                    }
                });
                try {
                    connection.release()
                } catch (e) {}
                if (error) {
                    ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                    return false;
                }
                return true;
            });
        });
    }
}

async function errorHandler(error, callback = undefined) {
    let errorId = crypto.randomBytes(25).toString('hex');
    let customError = {
        code: 0,
        type: `unknown`,
        id: errorId,
        fatal: true,
        text: `This is an unknown error yet. Contact an administrator with the ID: ${errorId}`,
        error: error
    };
    if (error.code == "INVALID_TYPE") { //Supplied X is not a X, Snowflake or Array or Collection of X or Snowflakes.
        customError.fatal = false;
        customError.code = 100;
        customError.type = `discord`;
        customError.text = `Could not fetch what you were looking for with this parameter.`;
        return (typeof callback == "function") ? callback(customError) : customError;
    }
    if (error.code == 10007) { //Unknown user
        customError.fatal = false;
        customError.code = 404;
        customError.type = `discord`;
        customError.text = `Unknown member`;
        return (typeof callback == "function") ? callback(customError) : customError;
    }
    if (error.code == 10013) { //Unknown user
        customError.fatal = false;
        customError.code = 404;
        customError.type = `discord`;
        customError.text = `Unknown user`;
        return (typeof callback == "function") ? callback(customError) : customError;
    }
    console.log(error.code)
    ErrorLog.log(`An unexpected and unhandled error occured. [${customError.id}][${customError.error}][sqlManager.js]`);
    return (typeof callback == "function") ? callback(customError) : customError;
}

/*

e => {
    if (e.toString() == "DiscordAPIError: Unknown Member") {
        zisse.sqlPool.query(`UPDATE \`moderationLogs\` SET \`status\`='expired', \`updaterId\`='${zisse.client.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishments.numId}`);
        MainLog.log(`Member ${indPunishments.userId} left, expiring punishment. ${e.toString()}`);
    } else {
        MainLog.log(`Could not unban ${indPunishments.userId}. ${e.toString()}`);
    }
}

*/