const {
    textContains
} = require(`./utilities`);

let checkWords = {
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
                    action: guild.configurationManager.configuration.moderation.autoModeration.modules.scams.reaction
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
                    action: guild.configurationManager.configuration.moderation.autoModeration.modules.scams.reaction
                };
                if (textContains(message.content, word))
                    if (!violations.some(e => (e.check == violation.check && e.value == violation.value))) violations.push(violation);
            });
        }
        guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.log.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`log`]
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('log')))) violations.push(violation);
        });
        guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.alert.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`alert`]
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('alert')))) violations.push(violation);
        });
        guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.delete.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`delete`]
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('delete')))) violations.push(violation);
        });
        guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.warn.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`warn`],
                actionData: {
                    reason: guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.warnReason
                }
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('warn')))) violations.push(violation);
        });
        guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.mute.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`mute`],
                actionData: {
                    reason: guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.muteReason,
                    duration: guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.muteDuration
                }
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('mute')))) violations.push(violation);
        });
        guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.ban.forEach(word => {
            let violation = {
                check: `Unnamed`,
                trigger: "User Set",
                value: word,
                action: [`ban`],
                actionData: {
                    reason: guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.banReason,
                    duration: guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.banDuration
                }
            };
            if (textContains(message.content, word))
                if (!violations.some(e => (e.check == violation.check && e.value == violation.value && e.action.includes('ban')))) violations.push(violation);
        });
        res(violations);
    });
}