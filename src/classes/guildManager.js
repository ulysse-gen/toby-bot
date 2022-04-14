//Import Node modules
const fs = require('fs');
const moment = require('moment');
const mysql = require('mysql');
const {
    MessageEmbed
} = require(`discord.js`);


//Import classes
const Logger = require(`./Logger`);
const permissionManager = require(`./permissionsManager`);
const configurationManager = require(`./configurationManager`);
const moderationManager = require(`../classes/moderationManager`);

const configuration = {
    appName: "Toby Bot",
    appId: "933695613294501888"
}

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class guildManager {
    constructor(client, guild, globalGuilds) {
        this.client = client;
        this.guild = guild;
        this.globalGuilds = globalGuilds;
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));

        this.waitingForMessage = {
            users: {},
            channels: {},
            data: {
                say: {},
                rockpaperscissors: {}
            }
        }

        this.waitingForInteraction = {
            users: {},
            channels: {},
            data: {
                russianroulette: {}
            }
        }

        this.lastMessages = {

        }

        this.logToChannel = {
            initialized: false
        };
        this.moderationLog = {
            initialized: false
        };
        this.autoModerationLog = {
            initialized: false
        };
        this.initialized = false;
    }

    async initialize() {
        if (!fs.existsSync(`${process.cwd()}/configurations`)) fs.mkdirSync(`${process.cwd()}/configurations`);
        if (!fs.existsSync(`${process.cwd()}/configurations/guilds`)) fs.mkdirSync(`${process.cwd()}/configurations/guilds`);
        if (!fs.existsSync(`${process.cwd()}/configurations/guilds/${this.guild.id}`)) fs.mkdirSync(`${process.cwd()}/configurations/guilds/${this.guild.id}`);
        this.permissionsManager = new permissionManager(this.client, `../../configurations/default/permissions.json`, `guildsPermissions`, `\`guildId\` = '${this.guild.id}'`, this.guild.id);
        this.permissions = this.permissionsManager.permissions;
        this.configurationManager = new configurationManager(this.client, `../../configurations/default/configuration.json`, `guildsConfigurations`, `\`guildId\` = '${this.guild.id}'`, this.guild.id);
        this.configuration = this.configurationManager.configuration;
        this.embedsManager = new configurationManager(this.client, `../../configurations/default/embeds.json`, `guildsEmbeds`, `\`guildId\` = '${this.guild.id}'`, this.guild.id);
        this.embeds = this.embedsManager.configuration;
        this.moderationManager = new moderationManager(this.client, this.globalGuilds);
        await this.permissionsManager.initialize();
        await this.configurationManager.initialize();
        await this.embedsManager.initialize();
        this.initialized = true;
        await this.initChannelLogging();
        await this.initModerationLogging();
        await this.initAutoModerationLogging();
        return true;
    }

    async initChannelLogging() {
        if (!this.initialized || !this.configuration.behaviour.logToChannel.status || this.configuration.behaviour.logToChannel.channel == "none") return false;
        try {
            await this.guild.channels.fetch(this.configuration.behaviour.logToChannel.channel).then(channel => {
                this.logToChannel.channel = channel;
                this.logToChannel.initialized = true;
            }).catch(e => {
                console.log(`Could not get logging channel for guild [${this.configuration.behaviour.logToChannel.channel}][${e.toString()}]`)
            });
        } catch (e) {}
        return true;
    }

    async initModerationLogging() {
        if (!this.initialized || !this.configuration.moderation.logToChannel.status || this.configuration.moderation.logToChannel.channel == "none") return false;
        try {
            await this.guild.channels.fetch(this.configuration.moderation.logToChannel.channel).then(channel => {
                this.moderationLog.channel = channel;
                this.moderationLog.initialized = true;
            }).catch(e => {
                console.log(`Could not get moderation logging channel for guild [${this.configuration.moderation.logToChannel.channel}][${e.toString()}]`)
            });
        } catch (e) {}
        return true;
    }

    async initAutoModerationLogging() {
        if (!this.initialized || !this.configuration.moderation.autoModeration.channel.status || this.configuration.moderation.autoModeration.channel.channel == "none") return false;
        try {
            await this.guild.channels.fetch(this.configuration.moderation.autoModeration.channel.channel).then(channel => {
                this.autoModerationLog.channel = channel;
                this.autoModerationLog.initialized = true;
            }).catch(e => {
                console.log(`Could not get auto moderation logging channel for guild [${this.configuration.moderation.autoModeration.channel.channel}][${e.toString()}]`)
            });
        } catch (e) {}
        return true;
    }

    channelLog(string) {
        if (!this.initialized || !this.configuration.behaviour.logToChannel.status) return;
        if (typeof this.logToChannel.initialized == "undefined" || !this.logToChannel.initialized) return false;
        if (typeof string != "string" && string == "") return false;
        let logText = this.configuration.behaviour.logToChannel.format.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`MMMM Do YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss`)).replace(`&{DISCORDDATE}`, `<t:${Math.floor(new Date().getTime() / 1000)}:F>`);

        this.logToChannel.channel.send(logText).catch(_e => {
            if (this.configuration.behaviour.logToChannel.status) this.configuration.behaviour.logToChannel.status = false;
            console.log(`Could not use the logging channel for guild ${this.guild.id}`);
        });
        return true;
    }

    channelEmbedLog(title, description, color, fields = []) {
        if (!this.initialized || !this.configuration.behaviour.logToChannel.status) return;
        if (typeof this.logToChannel.initialized == "undefined" || !this.logToChannel.initialized) return false;
        if (typeof title != "string" || title == "") return false;
        if (typeof description != "string" || description == "") return false;
        if (typeof color != "string" || color == "") return false;
        if (typeof fields != "object") return false;
        let embed = new MessageEmbed().setTitle(title).setDescription(description).setColor(color);
        fields.forEach(field => embed.addField(field[0], field[1], field[2]));

        this.logToChannel.channel.send({
            embeds: [embed]
        }).catch(e => {
            console.log(e);
            if (this.configuration.behaviour.logToChannel.status) this.configuration.behaviour.logToChannel.status = false;
            console.log(`Could not use the logging channel for guild ${this.guild.id}`);
        });
        return true;
    }

    autoModlLog(string) {
        if (!this.initialized || !this.configuration.moderation.autoModeration.channel.status) return;
        if (typeof this.autoModerationLog.initialized == "undefined" || !this.autoModerationLog.initialized) return false;
        if (typeof string != "string" && string == "") return false;
        let logText = this.configuration.moderation.autoModeration.channel.format.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`MMMM Do YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss`)).replace(`&{DISCORDDATE}`, `<t:${Math.floor(new Date().getTime() / 1000)}:F>`);

        this.autoModerationLog.channel.send(logText).catch(_e => {
            if (this.configuration.moderation.autoModeration.channel.status) this.configuration.moderation.autoModeration.channel.status = false;
            console.log(`Could not use the logging channel for guild ${this.guild.id}`);
        });
        return true;
    }

    autoModEmbedLog(title, description, color, fields = []) {
        if (!this.initialized || !this.configuration.moderation.autoModeration.channel.status) return;
        if (typeof this.autoModerationLog.initialized == "undefined" || !this.autoModerationLog.initialized) return false;
        if (typeof title != "string" || title == "") return false;
        if (typeof description != "string" || description == "") return false;
        if (typeof color != "string" || color == "") return false;
        if (typeof fields != "object") return false;
        let embed = new MessageEmbed().setTitle(title).setDescription(description).setColor(color);
        fields.forEach(field => embed.addField(field[0], field[1], field[2]));

        this.autoModerationLog.channel.send({
            embeds: [embed]
        }).catch(e => {
            console.log(e);
            if (this.configuration.moderation.autoModeration.channel.status) this.configuration.moderation.autoModeration.channel.status = false;
            console.log(`Could not use the logging channel for guild ${this.guild.id}`);
        });
        return true;
    }

    async setReminder(guildId, userId, channelId, time, data) {
        let zisse = this;
        let values = [guildId, userId, channelId, time, JSON.stringify(data)];
        let valueNames = ["guildId", "userId", "channelId", "timestamp", "content"];
        return new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`INSERT INTO \`reminders\` (\`${valueNames.join('`,`')}\`) VALUES (?,?,?,?,?)`, values, async function (error, _results, _fields) {
                    try {
                        connection.release()
                    } catch (e) {}
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                    }
                    res(true);
                });
            });
        });
    }

    async kickUser(message, userId, reason, time = 0, punishAsBot = false, silent = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.kickNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        return user.kick(`Kicked by ${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) for ${reason}`).then(async () => {
            let caseId = await zisse.moderationManager.log(message.guild.id, `Kick`, user.user.id, (!punishAsBot) ? message.author.id : configuration.appId, reason, false);
            await zisse.moderationManager.sendPunishEmbed(message, zisse, `Kick`, caseId, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, false, silent);
            MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) kicked ${user.user.tag}(${user.user.id}) for '${reason}' from ${this.guild.id}`);
            if (zisse.configuration.moderation.sendKickAlertInDM) await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Kick`, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, false);
            return {
                errored: false
            };
        }).catch(e => {
            return {
                errored: true,
                reason: e
            };
        });
    }

    async banUser(message, userId, reason, time = 0, punishAsBot = false, silent = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (this.configuration.moderation.banNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        if (typeof user == "undefined") return this.guild.bans.create(userId)
            .then(() => {
                return afterBan({
                    id: userId,
                    user: {
                        id: userId,
                        tag: `Unknown#Tag`
                    }
                })
            })
            .catch(e => {
                return {
                    errored: true,
                    reason: e
                };
            });
        if (typeof user != "undefined") return user.ban({
            days: 7,
            reason: `Banned by ${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) for ${reason}`
        }).then(() => {
            return afterBan(user)
        }).catch(e => {
            return {
                errored: true,
                reason: e
            };
        });
        return {
            errored: false
        };
        async function afterBan(user) {
            let caseId = await zisse.moderationManager.log(message.guild.id, `Ban`, user.user.id, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : undefined);
            await zisse.moderationManager.sendPunishEmbed(message, zisse, `Ban`, caseId, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : undefined, silent);
            MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) banned ${user.user.tag}(${user.user.id}) for '${reason}' from ${zisse.guild.id}`);
            if (zisse.configuration.moderation.sendBanAlertInDM && typeof user.send == "function") await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Ban`, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : undefined);
            return {
                errored: false
            };
        }
    }

    async warnUser(message, userId, reason, time = 0, punishAsBot = false, silent = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "") return {
            errored: true,
            reason: `No reason specified.`
        };
        //Here warn the player & log in in sql
        let caseId = await zisse.moderationManager.log(message.guild.id, `Warn`, user.user.id, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : false);
        await zisse.moderationManager.sendPunishEmbed(message, zisse, `Warn`, caseId, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, false, silent);
        MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) warned ${user.user.tag}(${user.user.id}) for ${reason} in ${this.guild.id}`);
        return (zisse.configuration.moderation.sendWarningInDM) ? zisse.moderationManager.sendPlayerPunishment(message, zisse, `Warn`, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, false) : {
            errored: false
        };
    }

    async noteUser(message, userId, reason, time = 0, punishAsBot = false, silent = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "") return {
            errored: true,
            reason: `No reason specified.`
        };
        //Here warn the player & log in in sql
        let caseId = await zisse.moderationManager.log(message.guild.id, `Note`, user.user.id, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : false);
        await zisse.moderationManager.sendPunishEmbed(message, zisse, `Note`, caseId, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, false, silent);
        MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) noted ${user.user.tag}(${user.user.id}) for ${reason} in ${this.guild.id}`);
        return {
            errored: false
        };
    }

    async muteUser(message, userId, reason, time = 0, punishAsBot = false, silent = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.muteNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        return this.guild.roles.fetch(this.configuration.moderation.muteRole).then(fetchedRole => {
            return user.roles.add(fetchedRole, `Muted by ${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) for ${reason}`).then(async () => {
                let caseId = await this.moderationManager.log(message.guild.id, `Mute`, user.user.id, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : undefined);
                await zisse.moderationManager.sendPunishEmbed(message, zisse, `Mute`, caseId, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : undefined, silent);
                MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) muted ${user.user.tag}(${user.user.id}) for ${reason} in ${this.guild.id}`);
                if (zisse.configuration.moderation.sendMuteAlertInDM) await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Mute`, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : undefined);
                return {
                    errored: false
                };
            }).catch(e => {
                return {
                    errored: true,
                    reason: e
                };
            });
        }).catch(e => {
            return {
                errored: true,
                reason: e
            };
        });
    }

    async stickyUser(message, userId, reason, time = 0, punishAsBot = false, silent = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.muteNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let caseId = await zisse.moderationManager.log(message.guild.id, `Sticky`, user.user.id, (!punishAsBot) ? message.author.id : configuration.appId, reason, (time != 0) ? time : false);
        await zisse.moderationManager.sendPunishEmbed(message, zisse, `Sticky`, caseId, user, (!punishAsBot) ? message.author.id : configuration.appId, reason, false, silent);
        MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) sticky noted ${user.user.tag}(${user.user.id}) for ${reason} in ${this.guild.id}`);
        return {
            errored: false
        };
    }

    async unbanUser(message, userId, reason, punishAsBot = false) {
        let zisse = this;
        let user = userId;
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (user.startsWith('<@!')) user = user.replace('<@!', '').slice(0, -1);
        if (user.startsWith('<@')) user = user.replace('<@', '').slice(0, -1);
        if (user.length != 18) return {
            errored: true,
            reason: `You can only unban via UserID.`
        };
        if (this.configuration.moderation.unbanNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let isSQLBanned = await this.moderationManager.isUserPunished(user, this.guild.id, `Ban`);
        let isDiscordBanned = await this.guild.bans.fetch(user, {
            cache: false,
            force: true
        }).then(() => true).catch(e => false);
        if (!isDiscordBanned && !isSQLBanned) return {
            errored: true,
            reason: `This user is not banned.`
        };
        return this.guild.bans.remove(userId, `Unbanned by ${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId})for ${reason}`).then(async () => {
            if (isSQLBanned) {
                zisse.moderationManager.sqlPool.getConnection((err, connection) => {
                    if (err) {
                        ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                        return {
                            errored: true,
                            reason: err
                        };
                    }
                    connection.query(`UPDATE \`moderationLogs\` SET \`status\`='unbanned', \`updaterId\`='${(!punishAsBot) ? message.author.id : configuration.appId}', \`updateReason\`='${reason}', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`userId\`='${userId}' AND \`guildId\`='${this.guild.id}' AND \`type\`='Ban' AND (\`status\`='active' OR \`status\`='indefinite')`, async function (error, results, fields) {
                        //Not used
                    });
                    MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) unbanned (${userId}) for '${reason}' from ${this.guild.id}`);
                    try {
                        connection.release()
                    } catch (e) {}
                    return {
                        errored: false
                    };
                });
            }
        }).catch(e => {
            return {
                errored: true,
                reason: e
            }
        });
    }

    async unmuteUser(message, userId, reason, punishAsBot = false) {
        let zisse = this;
        let user = await this.grabUser(message, userId);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.unmuteNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let isSQLMuted = await this.moderationManager.isUserPunished(user, this.guild.id, `Mute`);
        return this.guild.roles.fetch(this.configuration.moderation.muteRole).then(async fetchedRole => {
            return user.roles.remove(fetchedRole, `Unmuted by ${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) for ${reason}`).then(async () => {
                return new Promise((res, _rej) => {
                    zisse.moderationManager.sqlPool.getConnection((err, connection) => {
                        if (err) {
                            ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                            res({
                                errored: true,
                                reason: err.toString()
                            });
                        }
                        connection.query(`UPDATE \`moderationLogs\` SET \`status\`='unmuted', \`updaterId\`='${(!punishAsBot) ? message.author.id : configuration.appId}', \`updateReason\`='${reason}', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`userId\`='${user.user.id}' AND \`guildId\`='${this.guild.id}' AND \`type\`='Mute' AND (\`status\`='active' OR \`status\`='indefinite')`, async function (error, results, fields) {
                            //Not used
                        });
                        MainLog.log(`${(!punishAsBot) ? message.author.tag : configuration.appName}(${(!punishAsBot) ? message.author.id : configuration.appId}) unmuted ${user.user.tag}(${user.user.id}) for '${reason}' from ${this.guild.id}`);
                        res({
                            errored: false
                        });
                    });
                });
            }).catch(e => {
                return {
                    errored: true,
                    reason: e
                }
            });
        }).catch(e => {
            return {
                errored: true,
                reason: e
            }
        });
    }

    async grabUser(message, userString) {
        let user = (userString.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        }) : await message.channel.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userString));
        if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userString, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        return user;
    }
}