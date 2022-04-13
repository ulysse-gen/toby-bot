const {
    MessageEmbed
} = require(`discord.js`);
const colors = require(`colors`);
const moment = require(`moment`);
const linkify = require('linkifyjs');
const antiProfanity = require('anti-profanity');
const removeAccents = require(`remove-accents`);
const leetSpeakConverter = require('../utils/leet-converter');
const url = require('url');

const {
    client,
    configuration,
    MainLog,
    AutoModLog,
    MainSQLLog,
    globalPermissions,
    executionTimes
} = require(`../../index`);

const utils = require(`../utils`);

/*
Trigger Names:
N-Word
F-Word
H-Related
Sexual Content
profanity
Racism
URL
Email
*/

module.exports = async function (message, guild = undefined) {
    let messageMetric =  message.customMetric;
    messageMetric.addEntry(`ChatModerationStart`);

    messageMetric.addEntry(`TobyReactionsCheck`);
    tobyReaction(message);
    messageMetric.addEntry(`CantSayThingsCheck`);
    cantSayThings(message);

    messageMetric.addEntry(`ChatBypassCheck`);
    let permissionToCheck = `chat.fullbypass`;
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    if (hasPermission && !message.content.includes('-dontbypass')) return true;
    messageMetric.addEntry(`ChatBypassChecked`);

    let violations = [];

    messageMetric.addEntry(`ChatLinkifyCheck`);
    let linkifyReturn = linkify.find(message.content);
    messageMetric.addEntry(`ChatLinkifyChecked`);
    if (linkifyReturn.length != 0)
        for (const element of linkifyReturn) {
            let linkToScan = element.value;
            if (url.parse(linkToScan, false).href != null) {
                linkToScan = (!linkToScan.startsWith('https://')) ? `https://${linkToScan}` : linkToScan;
            }
            if (url.parse(linkToScan, false).hostname != null && guild.moderationManager.scamLinks.includes(url.parse(linkToScan, false).hostname)) {
                violations.push({
                    check: `spen.tk`,
                    trigger: "Scam URL",
                    value: element.value
                });
            }
            violations.push({
                check: `linkify`,
                trigger: element.type,
                value: element.value
            });
        }

    messageMetric.addEntry(`ChatCustomProfanitiesCheck`);
    let customDetect = detectProfanities(message.content, guild);
    if (customDetect.length != 0)
        for (const element of customDetect) {
            violations.push({
                check: `custom`,
                trigger: element.trigger,
                value: element.value
            });
        }
    messageMetric.addEntry(`ChatCustomProfanitiesChecked`);

    if (violations.length != 0) {
        messageMetric.addEntry(`ChatViolationSummary`);
        //This message has been detected as containing profanities
        let violationsArray = [];
        let violationsContent = [];
        let checkArray = [];

        let user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        });

        let triggers = [{
                check: "custom",
                trigger: "N-Word"
            },
            {
                check: "custom",
                trigger: "F-Slur"
            },
            {
                check: "custom",
                trigger: "H-Related"
            },
            {
                check: "custom",
                trigger: "Sexual"
            },
            {
                check: "custom",
                trigger: "Profanity"
            },
            {
                check: "linkify",
                trigger: "url"
            },
            {
                check: "linkify",
                trigger: "email"
            },
            {
                check: "spen.tk",
                trigger: "Scam URL"
            },
            {
                check: "spen.tk",
                trigger: "Scam Domain"
            }
        ]

        for (const trigger of triggers) {
            if (violations.some(e => (e.check == trigger.check && e.trigger == trigger.trigger))) {
                if (!violationsArray.includes(trigger.trigger)) violationsArray.push(trigger.trigger);
                if (!checkArray.includes(trigger.check)) checkArray.push(trigger.check);
                let content = violations.map(e => {
                    if (e.trigger == trigger.trigger && typeof e.value != "undefined") return e.value
                });
                content = content.filter(function (e) {
                    return (typeof e != "undefined" && e !== '')
                });
                content = content.map(e => {
                    if (typeof e == "string") return e.trim()
                });
                violationsContent = violationsContent.concat(content);
            }
        }


        let triggersList = (violationsArray.length == 1) ? violationsArray[0] : violationsArray.join(', ');
        let violationsList = (violationsContent.length == 1) ? violationsContent[0] : violationsContent.join(', ');
        let checkList = (checkArray.length == 1) ? checkArray[0] : checkArray.join(', ');
        guild.moderationManager.sendAutoModEmbed(message, guild, triggersList, checkList, user, violationsContent);
        AutoModLog.log(`Message containing ${triggersList} content (${violationsList}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
        messageMetric.addEntry(`ChatViolationSummaryDone`);
    }
    messageMetric.addEntry(`ChatViolationDone`);
}

function tobyReaction(message) {
    let reactions = {
        "👀": ["tobybot", "toby bot", "933695613294501888"],
        "<:meme_reverse:924184793053294623>": ["ily", "i love you"],
        "🥖": ["baguette", "baget", "baguet", "bread"]
    };
    let doNotReact = ["react", "reply", "emoji", "emote", "eyes", "put", "emoticon", "respond", "place", "hate", "position", "below", "under", "set", "please", "👀", "👁", "🥖", "uno", "card", "if"];
    let doNotReactChannel = ["962848473236009030", "962842664900911154", "962842493257396224", "962842467378548796"];
    let doNotReactUser = ["962848473236009030", "962842664900911154", "962842493257396224", "962842467378548796"];

    if (!doNotReactChannel.includes(message.channel.id) && !doNotReactUser.includes(message.author.id)) //Skip channels & users set as "doNotReact"
        if (!doNotReact.some(ind => textContains(message.content, ind))) //Skip message if contains any "doNotReact" words
            if (reactions["👀"].some(ind => textContains(message.content, ind))) { //Check for main reaction
                message.react(`👀`).catch(catchDoNothing());
                delete reactions["👀"];
                for (const key in reactions) {
                    if (reactions[key].some(ind => textContains(message.content, ind))) message.react(key).catch(catchDoNothing());
                }
            }
}

function cantSayThings(message) {
    let cantSayThingsData = {
        "817857555674038298": {
            things: ["h olidae", "ho lidae", "hol idae", "holi dae", "holid ae", "holida e", "h olidai", "ho lidai", "hol idai", "holi dai", "holid ai", "holida i", "ho liday", "hol iday", "holqate", "holf dqye", "hol!dae", "330826518370451457", "smd", "suck", "dick", "stfu", "s t f u", "shut the fuck up", "fuck", "fuc", "fuk", "shut up", ".... --- .-.. .. -.. .- .", "01110011 01101101 01100100", "01110011 01110100 01100110 01110101", "cunt", "suce ma bite", "hoe",
                "holi day", "holid ay", "holida y", "holidae", "holiday", "holidai", "holy", "holee", "holeeday", "holeedae", "holeedai", "holeday", "holedae", "holedai", "🅾️", "ℹ️", "🅰️", "⭕", ":octagonal_sign:", ":o:", "🇭", ":o2:", "🛑", "🇱", "🇮", "🇩", "🇦", "🇪", "c9n@ sik l qir", "head boy", "consi", "s m d", "01001000 01101111 01101100 01101001 01100100 01100001 01100101", "•", "sthu", "shut the hell up", "s t h u", "letter", "indicator",
                "holi day", "holi", "holedae", "holedai", "head admin", "headadmin", "admin", "consigliere ", "con sig liere", "consig", "sig", "liere "
            ],
            sendAfter: `<@${message.author.id}> nice try!`
        }
    };

    if (message.channel.guild.id == "891829347613306960" || message.channel.guild.id == "933416930038136832")
        if (typeof cantSayThingsData[message.author.id] != "undefined") {
            if (cantSayThingsData[message.author.id].things.some(ind => textContains(message.content, ind))) {
                message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                if (typeof cantSayThingsData[message.author.id].sendAfter != "undefined") message.channel.send(cantSayThingsData[message.author.id].sendAfter).catch(catchDoNothing());
                client.guilds.fetch("947407448799604766").then(fetchedGuild => {
                    fetchedGuild.channels.fetch("962848473236009030").then(fetchedChannel => {
                        fetchedChannel.send({
                            content: `<@${message.author.id}> said a word they are not allowed to in <#${message.channel.id}> :\n${message.content}`,
                            attachments: message.attachments,
                            stickers: message.stickers,
                            embeds: message.embeds
                        }).catch(catchSend());
                    }).catch(catchFetch());
                }).catch(catchFetch());
            }
        }
}

function detectProfanities(textToCheck, guild) {
    let violations = [];
    let checkWords = {
        "N-Word": ["migger", "negress", "nigga", "nigger", "yigger", "nigg "],
        "F-Slur": ["faggot", "fag"],
        "R-Slur": ["retard"],
        "H-Related": ["hitler", "nazy", "nazi"],
        "Sexual": ["porno", "sex", "ass", "tits", "dick", "pussy", "vagina", "penis", "cock", "anus", "blowjob", "anulingus", "cunnilingus", "sodomy", "sodomize", "cum", "creampie", "deepthroat", "butthole", "bukkake", "boobs", "boner", "masturbating", "masturbate", "masturbation"],
        "Profanity": ["ajbfGSGY7FGfpdARHg7GyjmkP$nMT8q&RM3AQJMx"],
        "Scam Therms": guild.moderationManager.scamTherms
    };
    for (const key in checkWords) {
        checkWords[key].forEach(el => {
            let violation = {
                check: `customProfanity`,
                trigger: key,
                value: el
            };
            if (textContains(textToCheck, el))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value))) violations.push(violation);
        });
    }
    return violations;
}

function textContains(text, word) {
    let messageText = text.toLowerCase();
    let splitters = [" ", ",", ".", ";", ":", "/", "\\", "-", "_", "+", "*", "="];
    let toTry = [word.toLowerCase(), word.replaceAll(' ', '')];
    let found = false;
    splitters.forEach(splitter => {
        let toAdd = word.split('').join(splitter);
        if (!toTry.includes(toAdd)) toTry.push(toAdd);
        toAdd = word.split('').join(splitter + splitter);
        if (!toTry.includes(toAdd)) toTry.push(toAdd);
        toAdd = word.split('').join(splitter + splitter + splitter);
        if (!toTry.includes(toAdd)) toTry.push(toAdd);
    });
    toTry.forEach(element => {
        let withoutAccents = removeAccents(element);
        if (!toTry.includes(withoutAccents)) toTry.push(withoutAccents);
    });
    toTry.forEach(possibility => {
        if ((new RegExp(escapeRegex(possibility))).test(messageText) || (new RegExp(escapeRegex(possibility))).test(leetSpeakConverter.convertInputReverse(messageText))) {
            found = true;
            return found;
        }
    });
    return found;
}

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function catchDoNothing() {
    return false;
}

function catchFetch() {
    MainLog.log(`Failed to fetch.`)
    return false;
}

function catchSend() {
    MainLog.log(`Failed to send.`)
    return false;
}