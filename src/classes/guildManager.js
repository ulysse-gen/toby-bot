//Import Node modules
const fs = require('fs');
const moment = require('moment');
const mysql = require('mysql');


//Import classes
const Logger = require(`./Logger`);
const permissionManager = require(`./permissionsManager`);
const configurationManager = require(`./configurationManager`);
const moderationManager = require(`../classes/moderationManager`);

//Loggers
const MainLog = new Logger();

module.exports = class guildManager {
    constructor(client, guild, globalGuilds) {
        this.client = client;
        this.guild = guild;
        this.globalGuilds = globalGuilds;

        this.waitingForMessage = {
            users: {},
            channels: {},
            data: {
                say: {},
                rockpaperscissors: {}
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
        this.initialized = false;
    }

    async initialize() {
        if (!fs.existsSync(`${process.cwd()}/configurations`)) fs.mkdirSync(`${process.cwd()}/configurations`);
        if (!fs.existsSync(`${process.cwd()}/configurations/guilds`)) fs.mkdirSync(`${process.cwd()}/configurations/guilds`);
        if (!fs.existsSync(`${process.cwd()}/configurations/guilds/${this.guild.id}`)) fs.mkdirSync(`${process.cwd()}/configurations/guilds/${this.guild.id}`);
        this.permissionsManager = new permissionManager(this.client, undefined, `../../configurations/default/permissions.json`, `guildsPermissions`, `\`guildId\` = '${this.guild.id}'`, this.guild.id);
        this.permissions = this.permissionsManager.permissions;
        this.configurationManager = new configurationManager(this.client, undefined, `../../configurations/default/configuration.json`, `guildsConfigurations`, `\`guildId\` = '${this.guild.id}'`, this.guild.id);
        this.configuration = this.configurationManager.configuration;
        this.embedsManager = new configurationManager(this.client, undefined, `../../configurations/default/embeds.json`, `guildsEmbeds`, `\`guildId\` = '${this.guild.id}'`, this.guild.id);
        this.embeds = this.embedsManager.configuration;
        this.moderationManager = new moderationManager(this.client, this.globalGuilds);
        await this.permissionsManager.initialize();
        await this.configurationManager.initialize();
        await this.embedsManager.initialize();
        this.initialized = true;
        await this.initChannelLogging();
        await this.initModerationLogging();
        return true;
    }

    async initChannelLogging() {
        if (!this.initialized || !this.configuration.behaviour.logToChannel.status || this.configuration.behaviour.logToChannel.channel == "none") return false;
        var zisse = this;
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
        var zisse = this;
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

    channelLog(string) {
        if (!this.initialized || !this.configuration.behaviour.logToChannel.status) return;
        if (typeof this.logToChannel.initialized == "undefined" || !this.logToChannel.initialized) return false;
        if (typeof string != "string" && string == "") return false;
        let logText = this.configuration.behaviour.logToChannel.format.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`MMMM Do YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss`)).replace(`&{DISCORDDATE}`, `<t:${Math.floor(new Date().getTime() / 1000)}:F>`);

        this.logToChannel.channel.send(logText).catch(e => {
            if (this.configuration.behaviour.logToChannel.status == true) this.configuration.behaviour.logToChannel.status = false;
            console.log(`Could not use the logging channel for guild ${this.guild.id}`);
        });
        return true;
    }

    async kickUser(message, userId, reason) {
        let zisse = this;
        let user = (userId.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        }) : await message.channel.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userId));
        if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.kickNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let result = await user.kick(`Kicked by ${message.author.tag}(${message.author.id}) for ${reason}`).then(async () => {
            let caseId = await zisse.moderationManager.log(message.guild.id, `Kick`, user.user.id, message.author.id, reason, false);
            await zisse.moderationManager.sendPunishEmbed(message, zisse, `Kick`, caseId, user, message.author.id, reason, false);
            MainLog.log(`${message.author.tag}(${message.author.id}) kicked ${user.user.tag}(${user.user.id}) for '${reason}' from ${this.guild.id}`);
            if (zisse.configuration.moderation.sendKickAlertInDM) await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Kick`, user, message.author.id, reason, false);
            return {
                errored: false
            };
        }).catch(e => {
            return {
                errored: true,
                reason: e
            };
        });
        return result;
    }

    async banUser(message, userId, reason, time) {
        let zisse = this;
        let user = (userId.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        }) : await message.channel.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userId));
        if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.banNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let result = user.ban({
            days: 7,
            reason: `Banned by ${message.author.tag}(${message.author.id}) for ${reason}`
        }).then(async () => {
            let caseId = await zisse.moderationManager.log(message.guild.id, `Ban`, user.user.id, message.author.id, reason, (time != 0) ? time : undefined);
            await zisse.moderationManager.sendPunishEmbed(message, zisse, `Ban`, caseId, user, message.author.id, reason, (time != 0) ? time : undefined);
            MainLog.log(`${message.author.tag}(${message.author.id}) banned ${user.user.tag}(${user.user.id}) for '${reason}' from ${this.guild.id}`);
            if (zisse.configuration.moderation.sendBanAlertInDM) await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Ban`, user, message.author.id, reason, (time != 0) ? time : undefined);
            return {
                errored: false
            };
        }).catch(e => {
            return {
                errored: true,
                reason: e
            };
        });
        return result;
    }

    async warnUser(message, userId, reason, time) {
        let zisse = this;
        let user = (userId.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        }) : await message.channel.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userId));
        if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "") return {
            errored: true,
            reason: `No reason specified.`
        };
        //Here warn the player & log in in sql
        let caseId = await zisse.moderationManager.log(message.guild.id, `Warn`, user.user.id, message.author.id, reason, (time != 0) ? time : false);
        await zisse.moderationManager.sendPunishEmbed(message, zisse, `Warn`, caseId, user, message.author.id, reason, false);
        MainLog.log(`${message.author.tag}(${message.author.id}) warned ${user.user.tag}(${user.user.id}) for ${reason} in ${this.guild.id}`);
        let userGotAlert = (zisse.configuration.moderation.sendWarningInDM) ? await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Warn`, user, message.author.id, reason, false) : {
            errored: false
        };
        return userGotAlert;
    }

    async muteUser(message, userId, reason, time) {
        let zisse = this;
        let user = (userId.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        }) : await message.channel.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userId));
        if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.muteNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let result = this.guild.roles.fetch(this.configuration.moderation.muteRole).then(fetchedRole => {
            return user.roles.add(fetchedRole, `Muted by ${message.author.tag}(${message.author.id}) for ${reason}`).then(async () => {
                let caseId = await this.moderationManager.log(message.guild.id, `Mute`, user.user.id, message.author.id, reason, (time != 0) ? time : undefined);
                await zisse.moderationManager.sendPunishEmbed(message, zisse, `Mute`, caseId, user, message.author.id, reason, (time != 0) ? time : undefined);
                MainLog.log(`${message.author.tag}(${message.author.id}) muted ${user.user.tag}(${user.user.id}) for ${reason} in ${this.guild.id}`);
                if (zisse.configuration.moderation.sendMuteAlertInDM) await zisse.moderationManager.sendPlayerPunishment(message, zisse, `Mute`, user, message.author.id, reason, (time != 0) ? time : undefined);
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
        return result;
    }

    async unbanUser(message, userId, reason) {
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
        let result = await this.guild.bans.remove(userId, `Unbanned by ${message.author.tag}(${message.author.id}) for ${reason}`).then(async () => {
            if (isSQLBanned) {
                let connection = mysql.createConnection(this.moderationManager.sqlConfiguration);
                connection.connect();
                connection.query(`UPDATE \`moderationLogs\` SET \`status\`='unbanned', \`updaterId\`='${message.author.id}', \`updateReason\`='${reason}', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`userId\`='${userId}' AND \`guildId\`='${this.guild.id}' AND \`type\`='Ban' AND (\`status\`='active' OR \`status\`='indefinite')`, async function (error, results, fields) {});
                MainLog.log(`${message.author.tag}(${message.author.id}) unbanned (${userId}) for '${reason}' from ${this.guild.id}`);
                connection.end();
                return {
                    errored: false
                };
            }
        }).catch(e => {
            return {
                errored: true,
                reason: e
            }
        });
        return result;
    }

    async unmuteUser(message, userId, reason) {
        let zisse = this;
        let user = (userId.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        }) : await message.channel.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userId));
        if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        if (this.configuration.moderation.unmuteNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return {
            errored: true,
            reason: `No reason specified.`
        };
        let isSQLMuted = await this.moderationManager.isUserPunished(user, this.guild.id, `Mute`);
        let result = await this.guild.roles.fetch(this.configuration.moderation.muteRole).then(async fetchedRole => {
            return await user.roles.remove(fetchedRole, `Unmuted by ${message.author.tag}(${message.author.id}) for ${reason}`).then(async () => {
                let connection = mysql.createConnection(this.moderationManager.sqlConfiguration);
                connection.connect();
                connection.query(`UPDATE \`moderationLogs\` SET \`status\`='unmuted', \`updaterId\`='${message.author.id}', \`updateReason\`='${reason}', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`userId\`='${user.user.id}' AND \`guildId\`='${this.guild.id}' AND \`type\`='Mute' AND (\`status\`='active' OR \`status\`='indefinite')`, async function (error, results, fields) {});
                MainLog.log(`${message.author.tag}(${message.author.id}) unmuted ${user.user.tag}(${user.user.id}) for '${reason}' from ${this.guild.id}`);
                connection.end();
                return {errored: false}
            }).catch(e => {return {errored: true, reason: e}});
        }).catch(e => {return {errored: true, reason: e}});
        return result;
    }
}