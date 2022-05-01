const {
    MessageEmbed
} = require(`discord.js`);
const moment = require(`moment`);
const urlExists = require("url-exists");

const {
    globalConfiguration,
    MainLog,
    MainSQLLog
} = require(`../index`);

exports.makeId = async (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

exports.sendEmbed = (message, guild, title, description = undefined, color = `#FFFFFF`, fields = [], reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => {
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (typeof title == "undefined") return false;
    let embed = new MessageEmbed().setTitle(`${globalConfiguration.configuration.appName} - ${title}`).setColor(color);
    if (typeof description != "undefined" && description.replaceAll(' ', '') != "") embed.setDescription(description);
    if (typeof fields == "object" && fields.length > 0)
        fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));

    if (typeof reply == "object") {
        if (typeof reply.ephemeral != "undefined") {
            return message.reply({
                embeds: [embed],
                ephemeral: reply.ephemeral
            }).then(msg => execAfter(msg)).catch(e => {
                return {
                    error: e
                };
            });
        } else {
            return message.reply({
                embeds: [embed],
                ephemeral: false
            }).then(msg => execAfter(msg)).catch(e => {
                return {
                    error: e
                };
            });
        }
    } else if (reply) {
        return message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => execAfter(msg)).catch(e => {
            return {
                error: e
            };
        });
    }
    return message.channel.send({
        embeds: [embed],
        failIfNotExists: false
    }, false).then(msg => execAfter(msg)).catch(e => {
        return {
            error: e
        };
    });

    function execAfter(msg) {
        if (typeof reply == "object") {
            return true;
        }
        if (deleteOriginalAfter > -1) setTimeout(() => {
            message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
        }, deleteOriginalAfter);
        if (deleteItselfAfter > -1) setTimeout(() => {
            msg.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
        }, deleteItselfAfter);
        return true;
    }
}

exports.sendMain = (message, guild, title, description = undefined, fields = [], reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => this.sendEmbed(message, guild, title, description, guild.configurationManager.configuration.colors.main, fields, reply, deleteOriginalAfter, deleteItselfAfter);
exports.sendSuccess = (message, guild, title = `Success`, description = undefined, fields = [], reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => this.sendEmbed(message, guild, title, description, guild.configurationManager.configuration.colors.success, fields, reply, deleteOriginalAfter, deleteItselfAfter);
exports.sendError = (message, guild, title = `Error`, description = undefined, fields = [], reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => this.sendEmbed(message, guild, title, description, guild.configurationManager.configuration.colors.error, fields, reply, deleteOriginalAfter, deleteItselfAfter);
exports.sendWarning = (message, guild, title = `Warning`, description = undefined, fields = [], reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => this.sendEmbed(message, guild, title, description, guild.configurationManager.configuration.colors.warning, fields, reply, deleteOriginalAfter, deleteItselfAfter);

exports.unknownCommand = (message, guild, reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => {
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (guild.configurationManager.configuration.behaviour.logOnUnknownCommand && guild.logToChannel.initialized)
        guild.channelEmbedLog(`Command Denied`, `${message.content}`, guild.configurationManager.configuration.colors.error, [
            [`Reason:`, `Unknown command`, true],
            [`Executor:`, `<@${message.author.id}>`, true],
            [`Channel:`, `<#${message.channel.id}>`, true],
            [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
        ]);
    if (guild.configurationManager.configuration.behaviour.onUnknownCommandIgnore) return true;
    return this.sendError(message, guild, `Unknown Command`, undefined, [], reply, deleteOriginalAfter, deleteItselfAfter);
}
exports.cooldownCommand = (message, guild, cooldownData, reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => {
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (guild.configurationManager.configuration.behaviour.logOnCooldown && guild.logToChannel.initialized)
        guild.channelEmbedLog(`Command Denied`, `${message.content}`, guild.configurationManager.configuration.colors.error, [
            [`Reason:`, `Cooldown`, true],
            [`Permission:`, `${cooldownData.perm}`, true],
            [`Executor:`, `<@${message.author.id}>`, true],
            [`Channel:`, `<#${message.channel.id}>`, true],
            [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
        ]);
    if (guild.configurationManager.configuration.behaviour.onCooldownIgnore) return true;
    return this.sendError(message, guild, `Cooldown`, `You will be able to execute this command in ${cooldownData.timeLeft} seconds.`, [], reply, deleteOriginalAfter, deleteItselfAfter);
}
exports.insufficientPermissions = (message, guild, permission, reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => {
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (guild.configurationManager.configuration.behaviour.logOnCommandDenied && guild.logToChannel.initialized)
        guild.channelEmbedLog(`Command Denied`, `${message.content}`, guild.configurationManager.configuration.colors.error, [
            [`Reason:`, `Insufficient Permissions`, true],
            [`Permission:`, `${permission}`, true],
            [`Executor:`, `<@${message.author.id}>`, true],
            [`Channel:`, `<#${message.channel.id}>`, true],
            [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
        ]);
    if (guild.configurationManager.configuration.behaviour.onCommandDeniedIgnore) return true;
    return this.sendError(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permission}\``, [], reply, deleteOriginalAfter, deleteItselfAfter);
}
exports.lockdownDenied = (message, guild, reply = false, deleteOriginalAfter = -1, deleteItselfAfter = -1) => {
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (guild.configurationManager.configuration.behaviour.logOnCommandDenied && guild.logToChannel.initialized)
        guild.channelEmbedLog(`Command Denied`, `${message.content}`, guild.configurationManager.configuration.colors.error, [
            [`Reason:`, `Command Lockdown`, true],
            [`Executor:`, `<@${message.author.id}>`, true],
            [`Channel:`, `<#${message.channel.id}>`, true],
            [`**Infos**`, `ID: ${message.author.id} • <t:${moment().unix()}:F>`, false]
        ]);
    if (guild.configurationManager.configuration.behaviour.onCommandDeniedIgnore) return true;
    return this.sendError(message, guild, `Command Lockdown`, undefined, [], reply, deleteOriginalAfter, deleteItselfAfter);
}

exports.getUserPfp = async (user) => {
    if (typeof user == "undefined" || (typeof user.user.avatar == "undefined" && typeof user.avatar == "undefined")) return `https://tobybot.ubd.ovh/assets/imgs/default_discord_avatar.png`;
    return await new Promise((res, rej) => {
        let urlBase = (user.avatar != null) ? `https://cdn.discordapp.com/guilds/${user.guild.id}/users/${user.user.id}/avatars/${user.avatar}` : `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}`;
        urlExists(`${urlBase}.gif`, function (err, exists) {
            res((exists) ? `${urlBase}.gif` : `${urlBase}.webp`);
        });
    });
}

exports.messageReplyFailLogger = (message, guild, error) => {
    MainSQLLog.log(`Reply Error`, ``, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`[ERROR] Could not reply to message ${message.id} in [${message.channel.id}@${message.channel.guild.id}] Error : ${error}`.yellow);
    if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized)
        guild.channelLog(`[ERROR] Could not reply to message ${message.id} in <#${message.channel.id}>(${message.channel.id}) Error : \`${error}\``);
}

exports.messageDeleteFailLogger = (message, guild, error) => {
    MainSQLLog.log(`Delete Error`, ``, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`[ERROR] Could not delete message ${message.id} from [${message.channel.id}@${message.channel.guild.id}] Error : ${error}`.yellow);
    if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized)
        guild.channelLog(`[ERROR] Could not delete message ${message.id} from <#${message.channel.id}>(${message.channel.id}) Error : \`${error}\``);
}

exports.catchCustomLog = (message, guild, error, customlog) => {
    MainSQLLog.log(`Custom Error`, `${customlog}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`[ERROR] ${customlog} [${message.channel.id}@${message.channel.guild.id}] Error : ${error}`.yellow);
    if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized)
        guild.channelLog(`[ERROR] ${customlog} <#${message.channel.id}>(${message.channel.id}) Error : \`${error}\``);
}

exports._escapeString = async (val) => {
    val = val.replace(/[\0\n\r\b\t\\'"`\x1a]/g, function (s) {
        switch (s) {
            case "\0":
                return "\\0";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\b":
                return "\\b";
            case "\t":
                return "\\t";
            case "\x1a":
                return "\\Z";
            case "'":
                return "''";
            case '"':
                return '""';
            default:
                return "\\" + s;
        }
    });

    return val;
};

exports.waitForInit = async (initVar) => {
    let waitForVarPromise = new Promise((res, rej) => {
        setInterval(() => {
            if (initVar == true) res(true);
        }, 500);
    });
    return await waitForVarPromise;
}

String.prototype.trimEllip = function (length) {
    return this.length > length ? this.substring(0, length) + "..." : this;
}

exports.splitArrayIntoChunksOfLen = function (arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}

Array.prototype.splitArrayIntoChunksOfLen = function (arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}