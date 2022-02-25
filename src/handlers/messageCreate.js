const {
    MessageEmbed
} = require(`discord.js`);
const colors = require(`colors`);

//Import needs from index
const {
    client,
    configuration,
    MainLog,
    globalGuilds,
    reload
} = require(`../../index`);

module.exports = async function (message) {
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

    if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).create(client, message);

    if (typeof configuration.skip.guilds[message.channel.guild.id] == "object") { //Skip message if its in the !MAIN! configuation as "to skip"
        if (configuration.skip.guilds[message.channel.guild.id].length == 1 && configuration.skip.guilds[message.channel.guild.id][0] == "*") return;
        if (configuration.skip.guilds[message.channel.guild.id].includes(message.channel.id)) return;
    }

    let reactions = {
        "👀": ["tobybot", "toby bot", "933695613294501888"],
        "<:meme_reverse:924184793053294623>": ["ily", "i love you"],
        "🥖": ["baguette", "baget", "baguet", "bread"]
    };
    let doNotReact = ["react", "reply", "emoji", "emote", "eyes", "put", "emoticon", "respond", "place", "hate", "position", "below", "under", "set", "please"];

    if (!doNotReact.some(ind => message.content.toLowerCase().includes(ind)))
        if (reactions["👀"].some(ind => message.content.toLowerCase().includes(ind))) {
            message.react(`👀`).catch(e => {});
            delete reactions["👀"];
            for (const key in reactions) {
                if (reactions[key].some(ind => message.content.toLowerCase().includes(ind))) message.react(key).catch(e => {});
            }
        }

    let guild = await globalGuilds.getGuild(message.channel.guild);

    if (!guild.initialized) return false;

    require(`./chatModeration`)(message, guild); //Same but if thats with guild prefix

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

    if (message.author.id == client.user.id) return; //Skip if himself

    if (message.type == "APPLICATION_COMMAND" || message.author.bot) return; //Skip if its a bot or an app message

    if (typeof guild.waitingForMessage == "object") {
        if (typeof guild.waitingForMessage.users[message.author.id] == "function") {
            let res = guild.waitingForMessage.users[message.author.id](message);
            if (res == true) return true;
        }
        if (typeof guild.waitingForMessage.channels[message.channel.id] == "object") {
            if (typeof guild.waitingForMessage.channels[message.channel.id][message.author.id] == "function") {
                let res = guild.waitingForMessage.channels[message.channel.id][message.author.id](message);
                if (res == true) return true;
            }
        }
    }

    if (message.content.startsWith(guild.configuration.prefix)) return require(`./commandHandler`)(message, guild); //Same but if thats with guild prefix
    if (message.content.startsWith(configuration.globalPrefix)) return require(`./commandHandler`)(message, guild); //If message starts with global prefix, exec

    return false;
}