const {
    textContains
} = require(`./utilities`);

let checkWords = {
    /*"N-Word": {
        status: true,
        action: ["log", "alert", "delete", "ban"],
        set: ["nigg"]
    },
    "F-Slur": {
        status: true,
        action: ["log", "alert", "delete"],
        set: ["fag"]
    },
    "R-Slur": {
        status: true,
        action: ["log", "alert", "delete"],
        set: ["retard"]
    },
    "H-Related": {
        status: true,
        action: ["log", "alert"],
        set: ["hitler"]
    },
    "Sexual": {
        status: false,
        action: ["log"],
        set: ["porno", "sex", "ass", "tits", "dick", "pussy", "vagina", "penis", "cock", "anus", "blowjob", "anulingus", "cunnilingus", "sodomy", "sodomize", "cum", "creampie", "deepthroat", "butthole", "bukkake", "boobs", "boner", "masturbating", "masturbate", "masturbation"]
    },*/
    "Scam terms": {
        status: true,
        action: ["log", "alert"],
        set: `eval:guild.moderationManager.scamterms`
    },
    "Scam Slashes": {
        status: true,
        action: ["log", "alert"],
        set: `eval:guild.moderationManager.scamSlashes`
    }
};

module.exports.detectProfanities = async (_client, message, guild = undefined, presets = {}) => {
    message.customMetric.addEntry(`ChatCustomProfanitiesCheck`);
    return new Promise(async (res, _rej) => {
        let violations = [];
        if (typeof presets.terms != undefined && presets.terms) {
            let key = "Scam terms";
            if (typeof checkWords[key].set == "string" && checkWords[key].set.startsWith(`eval:`)) {
                let builtSet = await eval(checkWords[key].set.replace('eval:', ''));
                checkWords[key].set = (typeof builtSet != "undefined") ? builtSet : checkWords[key].set;
            }
            if (typeof checkWords[key].set == "object") checkWords[key].set.forEach(word => {
                let violation = {
                    check: `Unnamed`,
                    trigger: key,
                    value: word,
                    action: guild.configuration.moderation.autoModeration.modules.scams.reaction
                };
                if (textContains(message.content, word))
                    if (!violations.some(e => (e.check == violation.check && e.value == violation.value))) violations.push(violation);
            });
        }
        if (typeof presets.slashes != undefined && presets.slashes) {
            let key = "Scam Slashes";
            if (typeof checkWords[key].set == "string" && checkWords[key].set.startsWith(`eval:`)) {
                let builtSet = await eval(checkWords[key].set.replace('eval:', ''));
                checkWords[key].set = (typeof builtSet != "undefined") ? builtSet : checkWords[key].set;
            }
            if (typeof checkWords[key].set == "object") checkWords[key].set.forEach(word => {
                let violation = {
                    check: `Unnamed`,
                    trigger: key,
                    value: word,
                    action: guild.configuration.moderation.autoModeration.modules.scams.reaction
                };
                if (textContains(message.content, word))
                    if (!violations.some(e => (e.check == violation.check && e.value == violation.value))) violations.push(violation);
            });
        }
        guild.configuration.moderation.autoModeration.modules.wordsDetection.log.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`log`]
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('log')))) violations.push(violation);
        });
        guild.configuration.moderation.autoModeration.modules.wordsDetection.alert.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`alert`]
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('alert')))) violations.push(violation);
        });
        guild.configuration.moderation.autoModeration.modules.wordsDetection.delete.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`delete`]
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('delete')))) violations.push(violation);
        });
        guild.configuration.moderation.autoModeration.modules.wordsDetection.warn.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`warn`],
                actionData: {
                    reason: guild.configuration.moderation.autoModeration.modules.wordsDetection.warnReason
                }
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('warn')))) violations.push(violation);
        });
        guild.configuration.moderation.autoModeration.modules.wordsDetection.mute.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`mute`],
                actionData: {
                    reason: guild.configuration.moderation.autoModeration.modules.wordsDetection.muteReason,
                    duration: guild.configuration.moderation.autoModeration.modules.wordsDetection.muteDuration
                }
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('mute')))) violations.push(violation);
        });
        guild.configuration.moderation.autoModeration.modules.wordsDetection.ban.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`ban`],
                actionData: {
                    reason: guild.configuration.moderation.autoModeration.modules.wordsDetection.banReason,
                    duration: guild.configuration.moderation.autoModeration.modules.wordsDetection.banDuration
                }
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('ban')))) violations.push(violation);
        });
        res(violations);
    });
}