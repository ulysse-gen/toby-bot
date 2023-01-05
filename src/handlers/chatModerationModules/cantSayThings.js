const {
    textContains
} = require(`./utilities`);

const cantSayThings = {};

module.exports.cantSayThings = async (client, message, _guild = undefined) => {
    message.customMetric.addEntry(`CantSayThingsCheck`);
    return new Promise((res, _rej) => {
        if (typeof cantSayThings[message.author.id] != "undefined")
            if (typeof cantSayThings[message.author.id].inGuild == "undefined" || cantSayThings[message.author.id].inGuild.length == 0 || cantSayThings[message.author.id].inGuild.includes(message.channel.guild.id))
                if (typeof cantSayThings[message.author.id].inChannel == "undefined" || cantSayThings[message.author.id].inChannel.length == 0 || cantSayThings[message.author.id].inChannel.includes(message.channel.id))
                    if (cantSayThings[message.author.id].list.some(ind => textContains(message.content, ind)))
                        if (typeof cantSayThings[message.author.id].action == "function") cantSayThings[message.author.id].action(client, message);
        res(true);
    });
};