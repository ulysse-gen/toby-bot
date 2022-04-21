const moment = require(`moment`);

//Import needs from index
const {
    client,
    globalConfiguration,
    MainLog,
    globalGuilds,
    executionTimes,
    blockedUsers,
    globalMetrics
} = require(`../../index`);

module.exports = async function (message) {
    let messageMetric = globalMetrics.createMetric(message.id);
    message.customMetric = messageMetric;
    messageMetric.addEntry(`MessageCreation`);
    /*
        Interesting things : 
        message.channelId;
        message.guildId;
        message.id;
        message.createdTimestamp;
        message.content;
        message.author;
        message.type; //(DEFAULT, REPLY, APPLICATION_COMMAND)
    */

        
    messageMetric.addEntry(`BlockedUsersCheck`);
    if (blockedUsers.includes(message.author.id)) {
        if (typeof message.channel.guild != "undefined") return false;
        MainLog.log(`Received DM from blocked user ${message.author.username}#${message.author.discriminator} (${message.author.id}) : ${message.content}`);
        message.author.send(`Ur blocked basically so you can stop lmao`);
        return true;
    }
    messageMetric.addEntry(`DMHandlerPass`);
    if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).create(client, message);

    messageMetric.addEntry(`SkipGuildsCheck`);
    if (typeof globalConfiguration.configuration.skip.guilds[message.channel.guild.id] == "object") { //Skip message if its in the !MAIN! configuation as "to skip"
        if (globalConfiguration.configuration.skip.guilds[message.channel.guild.id].length == 1 && globalConfiguration.configuration.skip.guilds[message.channel.guild.id][0] == "*") return;
        if (globalConfiguration.configuration.skip.guilds[message.channel.guild.id].includes(message.channel.id)) return;
    }

    messageMetric.addEntry(`GuildGrabbing`);
    let guild = await globalGuilds.getGuild(message.channel.guild);
    messageMetric.addEntry(`GuildGrabbed`);

    if (!guild.initialized) return false;

    messageMetric.addEntry(`LastMessagesPushing`);
    if (typeof guild.lastMessages[message.author.id] == "undefined") guild.lastMessages[message.author.id] = [];
    let lastMessagePush = {
        channelId: message.channel.id,
        guildId: message.channel.guild.id,
        userId: message.author.id,
        content: message.content,
        attachments: [],
        stickers: [],
        createdTimestamp: message.createdTimestamp
    };
    message.attachments.forEach(messageAttachement => lastMessagePush.attachments.push(messageAttachement.url));
    message.stickers.forEach(messageSticker => lastMessagePush.stickers.push(messageSticker.url));
    guild.lastMessages[message.author.id].unshift(lastMessagePush);
    if (guild.lastMessages[message.author.id].length >= 25) guild.lastMessages[message.author.id].splice(24, guild.lastMessages[message.author.id] - 25);
    messageMetric.addEntry(`LastMessagesPushed`);

    if (message.author.id == client.user.id) return; //Skip if himself

    if (message.type == "APPLICATION_COMMAND" || message.author.bot) return; //Skip if its a bot or an app message
    
    messageMetric.addEntry(`ChatModerationPass`);
    require(`./chatModeration`)(message, guild); //Same but if thats with guild prefix

    messageMetric.addEntry(`WaitingForMessagesChecks`);
    if (typeof guild.waitingForMessage == "object") {
        if (typeof guild.waitingForMessage.users[message.author.id] == "function") {
            let res = guild.waitingForMessage.users[message.author.id](message);
            if (res) return true;
        }
        if (typeof guild.waitingForMessage.channels[message.channel.id] == "object") {
            if (typeof guild.waitingForMessage.channels[message.channel.id][message.author.id] == "function") {
                let res = guild.waitingForMessage.channels[message.channel.id][message.author.id](message);
                if (res) return true;
            }
        }
    }

    messageMetric.addEntry(`CommandHandlerPass`);
    if (message.content.startsWith(guild.configurationManager.configuration.prefix)) return require(`./commandHandler`)(message, guild); //Same but if thats with guild prefix
    if (message.content.startsWith(globalConfiguration.configuration.globalPrefix)) return require(`./commandHandler`)(message, guild); //If message starts with global prefix, exec
    return false;
}