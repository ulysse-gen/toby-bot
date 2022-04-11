const {
    MessageEmbed
} = require(`discord.js`);
const colors = require(`colors`);
const moment = require(`moment`);
const linkify = require('linkifyjs');
const antiProfanity = require('anti-profanity');
const removeAccents = require(`remove-accents`);

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
    executionTimes[message.id].chatModeration = moment();

    let reactions = {
        "👀": ["tobybot", "toby bot", "933695613294501888"],
        "<:meme_reverse:924184793053294623>": ["ily", "i love you"],
        "🥖": ["baguette", "baget", "baguet", "bread"]
    };
    let doNotReact = ["react", "reply", "emoji", "emote", "eyes", "put", "emoticon", "respond", "place", "hate", "position", "below", "under", "set", "please", "👀", "👁", "🥖", "uno", "card", "if"];
    let doNotReactChannel = ["962848473236009030", "962842664900911154", "962842493257396224", "962842467378548796"]

    if (!doNotReactChannel.includes(message.channel.id))
        if (!doNotReact.some(ind => message.content.toLowerCase().includes(ind)))
            if (reactions["👀"].some(ind => message.content.toLowerCase().includes(ind))) {
                message.react(`👀`).catch(e => {});
                delete reactions["👀"];
                for (const key in reactions) {
                    if (reactions[key].some(ind => message.content.toLowerCase().includes(ind))) message.react(key).catch(e => {});
                }
            }

    let cantSayHolidae = ["817857555674038298"];

    let talkingAboutHolidae = ["h olidae","ho lidae","hol idae","holi dae","holid ae","holida e","h olidai","ho lidai","hol idai","holi dai","holid ai","holida i","ho liday","hol iday","holqate","holf dqye","H0L1DAE","hol!dae","330826518370451457","smd","suck","dick","stfu", "s t f u", "shut the fuck up","fuck","fuc","fuk","uck","shut up",".... --- .-.. .. -.. .- .","01110011 01101101 01100100","01110011 01110100 01100110 01110101",
                                "holi day","holid ay","holida y","holidae","holiday","holidai","holy","h0ly","h01y","holee","holeeday","holeedae","holeedai","holeday","holedae","holedai","🅾️","ℹ️","🅰️","⭕", ":octagonal_sign:",":o:","🇭",":o2:", "🛑", "🇱", "🇮", "🇩", "🇦", "🇪","c9n@ sik l qir","head boy","consi","s m d","01001000 01101111 01101100 01101001 01100100 01100001 01100101","•","sthu","shut the hell up","s t h u","letter","indicator",
                                "holi day","holi","dae","h011d43","|-|011[)43","holedae","h01idae","ho1idae","h0lidae","401idae","holedai","h01idai","ho1idai","h0lidai","401idai","head admin","headadmin","admin","consigliere ","con sig liere","consig","sig","liere "];

    if (message.channel.guild.id == "891829347613306960")
        if (cantSayHolidae.includes(message.author.id))
            if (talkingAboutHolidae.some(ind => message.content.toLowerCase().includes(ind))) {
                message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                message.channel.send(`<@${message.author.id}> nice try!`).catch(e => {});
                let attachments = [];
                let stickers = [];
                message.attachments.forEach(attachment => {
                    attachments.push(attachment);
                });
                message.stickers.forEach(sticker => {
                    stickers.push(sticker);
                });
                client.guilds.fetch("947407448799604766").then(guild => {
                    guild.channels.fetch("962848473236009030").then(channel => {
                        channel.send({
                            content: `Cant stop saying those istg => <@${message.author.id}> in <#${message.channel.id}> :\n${message.content}`,
                            files: attachments
                        }).catch(e => {});
                    }).catch(e => {});
                }).catch(e => {});
            }

    return true;
    let permissionToCheck = `chat.fullbypass`;
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    if (hasPermission == true) return true;

    let violations = [];

    let linkifyReturn = linkify.find(message.content);
    if (linkifyReturn.length != 0)
        for (let index = 0; index < linkifyReturn.length; index++) {
            const element = linkifyReturn[index];
            violations.push({
                check: `linkify`,
                trigger: element.type,
                value: element.value
            });
        }
    let antiProfanityReturn = antiProfanity.isProfane(message.content, true);
    if (antiProfanityReturn) violations.push({
        check: `antiProfanity`,
        trigger: `profanity`
    });

    let customDetect = detectProfanities(message);
    if (customDetect.length != 0)
        for (let index = 0; index < customDetect.length; index++) {
            const element = customDetect[index];
            violations.push({
                check: `custom`,
                trigger: element.trigger,
                value: element.value
            });
        }

    if (violations.length != 0) {
        //This message has been detected as containing profanities
        let violationsArray = [];

        let user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return false;
        });

        if (violations.some(e => (e.check == `custom` && e.trigger == `N-Word`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `N-Word`, `custom`, user, violations.map(e => {
                if (e.trigger == "N-Word" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`N-Word`);
            AutoModLog.log(`Message containing N-Word content (${violations.map(e => {if (e.trigger == "N-Word" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
        if (violations.some(e => (e.check == `custom` && e.trigger == `F-Slur`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `F-Slur`, `custom`, user, violations.map(e => {
                if (e.trigger == "F-Slur" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`F-Slur`);
            AutoModLog.log(`Message containing F-Slur content (${violations.map(e => {if (e.trigger == "F-Slur" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
        if (violations.some(e => (e.check == `custom` && e.trigger == `H-Related`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `H-Related`, `custom`, user, violations.map(e => {
                if (e.trigger == "H-Related" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`H-Related`);
            AutoModLog.log(`Message containing H-Related content (${violations.map(e => {if (e.trigger == "H-Related" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
        if (violations.some(e => (e.check == `custom` && e.trigger == `Sexual`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `Sexual`, `custom`, user, violations.map(e => {
                if (e.trigger == "Sexual" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`Sexual`);
            AutoModLog.log(`Message containing Sexual content (${violations.map(e => {if (e.trigger == "Sexual" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
        if (violations.some(e => (e.check == `custom` && e.trigger == `Profanity`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `Profanity`, `custom`, user, violations.map(e => {
                if (e.trigger == "Profanity" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`Profanity`);
            AutoModLog.log(`Message containing Profanity content (${violations.map(e => {if (e.trigger == "Profanity" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
        if (violations.some(e => (e.check == `linkify` && e.trigger == `url`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `url`, `linkify`, user, violations.map(e => {
                if (e.trigger == "url" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`URL`);
            AutoModLog.log(`Message containing URL content (${violations.map(e => {if (e.trigger == "url" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
        if (violations.some(e => (e.check == `linkify` && e.trigger == `email`))) {
            guild.moderationManager.sendAutoModEmbed(message, guild, `email`, `linkify`, user, violations.map(e => {
                if (e.trigger == "email" && typeof e.value != "undefined") return e.value
            }))
            violationsArray.push(`Email`);
            AutoModLog.log(`Message containing Email content (${violations.map(e => {if (e.trigger == "email" && typeof e.value != "undefined")return e.value}).join(', ')}) received from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id}.`);
            return true;
        }
    }
}

function detectProfanities(message) {
    let violations = [];
    let content = message.content.toLowerCase();
    let toCheck = [content];
    let splitters = [" ", ",", ".", ";", ":", "/", "\\", "-", "_", "+", "*", "="];
    let replacePatterns = [
        ["4", "a"],
        ["8", "b"],
        ["0", "d"],
        ["3", "e"],
        ["1", "i"],
        ["7", "l"],
        ["0", "o"],
        ["5", "s"],
        ["7", "t"],
        ["$", "s"],
        ["@", "a"]
    ];
    let checkWords = {
        "N-Word": ["migger", "negress", "nigga", "nigger", "yigger", "nigg "],
        "F-Slur": ["faggot", "fag"],
        "H-Related": ["hitler", "nazy", "nazi"],
        "Sexual": ["porno", "sex", "ass", "tits", "dick", "pussy", "vagina", "penis", "cock", "anus", "blowjob", "anulingus", "cunnilingus", "sodomy", "sodomize", "cum", "creampie", "deepthroat", "butthole", "bukkake", "boobs", "boner", "masturbating", "masturbate", "masturbation"],
        "Profanity": ["ajbfGSGY7FGfpdARHg7GyjmkP$nMT8q&RM3AQJMx"]
    }
    splitters.forEach(splitter => {
        toCheck.push(content.replaceAll(splitter, ``));
    });
    toCheck.forEach(element => {
        replacePatterns.forEach(replacePattern => {
            toCheck.push(element.replaceAll(replacePattern[0], replacePattern[1]));
        });
    });
    toCheck.forEach(element => {
        let withoutAccents = removeAccents(element);
        if (!toCheck.includes(withoutAccents)) toCheck.push(withoutAccents)
    });
    for (const key in checkWords) {
        toCheck.forEach(element => {
            checkWords[key].forEach(el => {
                let violation = {
                    check: `customProfanity`,
                    trigger: key,
                    value: el
                };
                if (element.includes(el))
                    if (!violations.some(e => (e.check == violation.check && e.value == violation.value))) violations.push(violation);
            })
        })
    }
    return violations;
}