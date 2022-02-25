const {
    MessageEmbed
} = require(`discord.js`);

const {
    configuration,
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

exports.sendMain = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole block i just call the funcion
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.main : configuration.colors.main //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return true;
}

exports.sendSuccess = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole block i just call the funcion
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.success : configuration.colors.success //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return true;
}

exports.sendUnkownCommand = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole block i just call the funcion
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (typeof logMessage != "undefined"){ //Is a log message defined ?
        MainSQLLog.log(`Unknown Command`, `${message.content}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
        MainLog.log(`${logMessage}`.grey); //Only runs if the thing on top was true, logs into console
    }
    if (typeof channelLogMessage != undefined) //Is a channel log message defined ?
        if (typeof guild != "undefined" && guild.configuration.behaviour.logOnUnknownCommand && guild.logToChannel.initialized) //Only runs if the thing on top was true, is the guild initialized & logOnUnknownCommand on
            guild.channelLog(`${channelLogMessage}`); //Only runs if the thing on top was true, logs into channel
    if (guild.configuration.behaviour.onUnknownCommandIgnore) return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.error : configuration.colors.error //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return false;
}

exports.sendCooldown = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole block i just call the funcion
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (typeof logMessage != "undefined"){ //Is a log message defined ?
        MainSQLLog.log(`Cooldown`, `${message.content}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
        MainLog.log(`${logMessage}`.grey); //Only runs if the thing on top was true, logs into console
    }
    if (typeof channelLogMessage != undefined) //Is a channel log message defined ?
        if (typeof guild != "undefined" && guild.configuration.behaviour.logOnCooldown && guild.logToChannel.initialized) //Only runs if the thing on top was true, is the guild initialized & logOnUnknownCommand on
            guild.channelLog(`${channelLogMessage}`); //Only runs if the thing on top was true, logs into channel
    if (guild.configuration.behaviour.onCooldownIgnore) return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.error : configuration.colors.error //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return false;
}

exports.sendDenied = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole block i just call the funcion
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (typeof logMessage != "undefined"){ //Is a log message defined ?
        MainSQLLog.log(`Command Denied`, `${message.content}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
        MainLog.log(`${logMessage}`.grey); //Only runs if the thing on top was true, logs into console
    }
    if (typeof channelLogMessage != "undefined") //Is a channel log message defined ?
        if (typeof guild != "undefined" && guild.configuration.behaviour.logOnCommandDenied && guild.logToChannel.initialized) //Only runs if the thing on top was true, is the guild initialized & logOnCommandDenied on
            guild.channelLog(`${channelLogMessage}`); //Only runs if the thing on top was true, logs into channel
    if (guild.configuration.behaviour.onCommandDeniedIgnore) return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.error : configuration.colors.error //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return false;
}

exports.sendError = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole block i just call the funcion
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (typeof logMessage != "undefined"){ //Is a log message defined ?
        MainSQLLog.log(`Error`, `${message.content}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
        MainLog.log(`${logMessage}`.red); //Only runs if the thing on top was true, logs into console
    }
    if (typeof channelLogMessage != "undefined") //Is a channel log message defined ?
        if (typeof guild != "undefined" && guild.configuration.behaviour.logOnCommandError && guild.logToChannel.initialized) //Only runs if the thing on top was true, is the guild initialized & logOnCommandError on
            guild.channelLog(`[ERROR]${channelLogMessage}`); //Only runs if the thing on top was true, logs into channel
    if (guild.configuration.behaviour.onCommandErrorIgnore) return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.error : configuration.colors.error //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return false;
}

exports.sendWarning = (message, guild = undefined, title, description = undefined, logMessage = undefined, channelLogMessage = undefined, fields = [], doNotRepy = false) => { //sendError exports.to makes error easier, instead of re typing the whole bl
    if (typeof message == "undefined") return false;
    if (typeof guild == "undefined") return false;
    if (typeof logMessage != "undefined"){ //Is a log message defined ?
        MainSQLLog.log(`Warning`, `${message.content}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
        MainLog.log(`${logMessage}`.yellow); //Only runs if the thing on top was true, logs into console
    }
    if (typeof channelLogMessage != "undefined") //Is a channel log message defined ?
        if (typeof guild != "undefined" && guild.configuration.behaviour.logOnWarning && guild.logToChannel.initialized) //Only runs if the thing on top was true, is the guild initialized & logOnWarning on
            guild.channelLog(`[WARNING]${channelLogMessage}`); //Only runs if the thing on top was true, logs into channel
    if (guild.configuration.behaviour.onWarningIgnore) return false;
    let embed = new MessageEmbed({ //Define the embed with the title and the error color
        color: (typeof guild != "undefined") ? guild.configuration.colors.warning : configuration.colors.warning //If guild is initialized, use their error color, else use default
    });
    if (typeof title != "undefined") embed.title = `${configuration.appName} - ${title}`; //If description has been sent, make it the embed content
    if (typeof description != "undefined") embed.description = `${description}`; //If description has been sent, make it the embed content
    fields.forEach(field => embed.addField(field[0], field[1], field[2]));
    if (!doNotRepy)message.reply({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    if (doNotRepy)message.channel.send({ //Reply to the message that triggerred the error
        embeds: [embed],
        failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
    }, false).then(msg => {
        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => this.messageDeleteFailLogger(message, guild, e));
    }).catch(e => this.messageReplyFailLogger(message, guild, e));
    return false;
}

exports.messageReplyFailLogger = (message, guild, error) => {
    MainSQLLog.log(`Reply Error`, ``, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`[ERROR] Could not reply to message ${message.id} in [${message.channel.id}@${message.channel.guild.id}] Error : ${error}`.yellow);
    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized)
        guild.channelLog(`[ERROR] Could not reply to message ${message.id} in <#${message.channel.id}>(${message.channel.id}) Error : \`${error}\``);
}

exports.messageDeleteFailLogger = (message, guild, error) => {
    MainSQLLog.log(`Delete Error`, ``, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`[ERROR] Could not delete message ${message.id} from [${message.channel.id}@${message.channel.guild.id}] Error : ${error}`.yellow);
    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized)
        guild.channelLog(`[ERROR] Could not delete message ${message.id} from <#${message.channel.id}>(${message.channel.id}) Error : \`${error}\``);
}

exports.catchCustomLog = (message, guild, error, customlog) => {
    MainSQLLog.log(`Custom Error`, `${customlog}`, guild.guild.id, message.channel.id, message.author.id, message.id); //Only runs if the thing on top was true, logs into console
    MainLog.log(`[ERROR] ${customlog} [${message.channel.id}@${message.channel.guild.id}] Error : ${error}`.yellow);
    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized)
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

exports.splitArrayIntoChunksOfLen = function(arr, len) {
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