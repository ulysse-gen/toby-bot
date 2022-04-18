const {
    textContains
} = require(`./utilities`);

const cantSayThings = {
    /*"817857555674038298": {
        inGuild: ["891829347613306960"],
        inChannel: [],
        list: ["h olidae", "ho lidae", "hol idae", "holi dae", "holid ae", "holida e", "h olidai", "ho lidai", "hol idai", "holi dai", "holid ai", "holida i", "ho liday", "hol iday", "holqate", "holf dqye", "hol!dae", "330826518370451457", "smd", "suck", "dick", "stfu", "s t f u", "shut the fuck up", "fuck", "fuc", "fuk", "shut up", ".... --- .-.. .. -.. .- .", "01110011 01101101 01100100", "01110011 01110100 01100110 01110101", "cunt", "suce ma bite", "hoe",
            "holi day", "holid ay", "holida y", "holidae", "holiday", "holidai", "holy", "holee", "holeeday", "holeedae", "holeedai", "holeday", "holedae", "holedai", "🅾️", "ℹ️", "🅰️", "⭕", ":octagonal_sign:", ":o:", "🇭", ":o2:", "🛑", "🇱", "🇮", "🇩", "🇦", "🇪", "c9n@ sik l qir", "head boy", "consi", "s m d", "01001000 01101111 01101100 01101001 01100100 01100001 01100101", "•", "sthu", "shut the hell up", "s t h u", "letter", "indicator",
            "holi day", "holi", "holedae", "holedai", "head admin", "headadmin", "admin", "consigliere ", "con sig liere", "consig", "sig", "liere"
        ],
        action: (client, message, _guild = undefined) => {
            message.channel.send(`<@${message.author.id}> nice try!`);
            message.delete().catch({});
            client.guilds.fetch("947407448799604766").then(fetchedGuild => {
                fetchedGuild.channels.fetch("962848473236009030").then(fetchedChannel => {
                    fetchedChannel.send({
                        content: `Anna said a word they are not allowed to (again) in <#${message.channel.id}> :\n${message.content}`,
                        attachments: message.attachments,
                        stickers: message.stickers,
                        embeds: message.embeds
                    }).catch({});
                }).catch({});
            }).catch({});
        }
    }*/
};

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