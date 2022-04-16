const {
    textContains
} = require(`./utilities`);

const TobyBotReactions = {
    "👀": ["tobybot", "toby bot", "933695613294501888", "toby"],
    "<:meme_reverse:924184793053294623>": ["ily", "i love you", "i hate you", "ihy"],
    "🥖": ["baguette", "baget", "baguet", "bread"]
};
const doNotReactToWords = ["react", "reply", "emoji", "emote", "eyes", "put", "emoticon", "respond", "place", "hate", "position", "below", "under", "set", "please", "👀", "👁", "🥖", "uno", "card", "if","noted"];
const doNotReactInChannel = ["962848473236009030", "962842664900911154", "962842493257396224", "962842467378548796"];
const doNotReactToUser = ["962848473236009030", "962842664900911154", "962842493257396224", "962842467378548796"];

module.exports.TobyBotReact = async (_client, message, _guild = undefined) => {
    message.customMetric.addEntry(`TobyReactionsCheck`);
    return new Promise((res, _rej) => {
        if (!doNotReactInChannel.includes(message.channel.id) && !doNotReactToUser.includes(message.author.id))
            if (!doNotReactToWords.some(ind => textContains(message.content, ind)))
                if (TobyBotReactions["👀"].some(ind => textContains(message.content, ind))) {
                    message.react(`👀`).catch({});
                    for (const key in TobyBotReactions) {
                        if (key != "👀" && TobyBotReactions[key].some(ind => textContains(message.content, ind))) message.react(key).catch({});
                    }
                }
        res(true);
    });
}