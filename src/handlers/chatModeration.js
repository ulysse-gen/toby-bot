const linkify = require('linkifyjs');
const url = require('url');

const {
    client,
    AutoModLog,
    globalPermissions,
    MainLog
} = require(`../../index`);

const {
    textContains
} = require(`./chatModerationModules/utilities`);

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

module.exports = async (message, guild = undefined) => {
    let messageMetric = message.customMetric;
    messageMetric.addEntry(`ChatModerationStart`);

    require(`./chatModerationModules/reactions`).TobyBotReact(client, message, guild);
    require(`./chatModerationModules/cantSayThings`).cantSayThings(client, message, guild);
    if (message.content.toLowerCase().includes('milky')) client.users.fetch('802797743071821845').then(milky => milky.send(`Someone said "milky" => https://discord.com/channels/${message.channel.guild.id}/${message.channel.id}/${message.id}`)).catch({});

    if (guild.configurationManager.configuration.moderation)
        if (guild.configurationManager.configuration.moderation.autoModeration.ignoredChannels.includes(message.channel.id)) return true;

    messageMetric.addEntry(`ChatBypassCheck`);
    let permissionToCheck = `chat.fullbypass`;
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    if (hasPermission && !message.content.includes('-dontbypass')) return true;
    messageMetric.addEntry(`ChatBypassChecked`);

    let violations = [];

    if ((guild.configurationManager.configuration.moderation.autoModeration.modules.links.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.links.ignoredChannels.includes(message.channel.id)) ||
        (guild.configurationManager.configuration.moderation.autoModeration.modules.scams.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.scams.ignoredChannels.includes(message.channel.id)) ||
        (guild.configurationManager.configuration.moderation.autoModeration.modules.discordInvite.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.discordInvite.ignoredChannels.includes(message.channel.id))) {
        messageMetric.addEntry(`ChatLinkifyCheck`);
        let linkifyReturn = linkify.find(message.content);
        if (linkifyReturn.length != 0)
            for (const element of linkifyReturn) {
                let linkUrl = url.parse(element.href);
                let linkData = {
                    fullLink: element.href,
                    fullHost: linkUrl.host,
                    mainDomain: `${linkUrl.host.split(".")[linkUrl.host.split(".").length-2]}.${linkUrl.host.split(".")[linkUrl.host.split(".").length-1]}`
                }

                if (guild.configurationManager.configuration.moderation.autoModeration.modules.discordInvite.status) {
                    if (textContains(linkData.fullLink, "discord.com/invite/")) {
                        violations.push({
                            check: `CustomDiscordInvite`,
                            trigger: "Discord Invite",
                            value: linkData.fullLink,
                            action: guild.configurationManager.configuration.moderation.autoModeration.modules.discordInvite.reaction
                        });
                    }
                }

                if (guild.configurationManager.configuration.moderation.autoModeration.modules.scams.links && typeof guild.moderationManager.scamLinks != "undefined" &&
                    (guild.moderationManager.scamLinks.includes(linkData.mainDomain) || guild.moderationManager.scamLinks.includes(`*.${linkData.mainDomain}`) || guild.moderationManager.scamLinks.includes(linkData.fullHost))) violations.push({
                    check: `spen.tk`,
                    trigger: "Scam URL",
                    value: element.value,
                    action: guild.configurationManager.configuration.moderation.autoModeration.modules.scams.reaction
                });

                if (guild.configurationManager.configuration.moderation.autoModeration.modules.links.status) {
                    if (guild.configurationManager.configuration.moderation.autoModeration.modules.links.overwrite.deny.includes(`*.${linkData.mainDomain}`) || guild.configurationManager.configuration.moderation.autoModeration.modules.links.overwrite.deny.includes(linkData.fullHost)) {
                        violations.push({
                            check: `linkify`,
                            trigger: element.type,
                            value: element.value,
                            action: guild.configurationManager.configuration.moderation.autoModeration.modules.links.reaction
                        });
                    } else if (!guild.configurationManager.configuration.moderation.autoModeration.modules.links.overwrite.allow.includes(`*.${linkData.mainDomain}`) && !guild.configurationManager.configuration.moderation.autoModeration.modules.links.overwrite.allow.includes(linkData.fullHost)) {
                        if (typeof guild.moderationManager.domainNames != undefined || !guild.configurationManager.configuration.moderation.autoModeration.modules.links.ignoreNonExistandTDLs ||
                            guild.moderationManager.domainNames.includes(linkData.mainDomain.split('.')[linkData.mainDomain.split('.') - 1].toUpperCase()))
                            if (!guild.configurationManager.configuration.moderation.autoModeration.modules.links.allowed.includes(`*.${linkData.mainDomain}`) && !guild.configurationManager.configuration.moderation.autoModeration.modules.links.allowed.includes(linkData.fullHost)) {
                                violations.push({
                                    check: `linkify`,
                                    trigger: element.type,
                                    value: element.value,
                                    action: guild.configurationManager.configuration.moderation.autoModeration.modules.links.reaction
                                });
                            }
                    }
                }
            }
        messageMetric.addEntry(`ChatLinkifyChecked`);
    }

    if (guild.configurationManager.configuration.moderation.autoModeration.modules.IPs.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.IPs.ignoredChannels.includes(message.channel.id)) {
        let IPCheckResult = await require(`./chatModerationModules/ipFilter`).ipFilter(client, message, guild);
        if (IPCheckResult.result) {
            violations.push({
                check: `CustomIPCheck`,
                trigger: "IP",
                value: IPCheckResult.value,
                action: guild.configurationManager.configuration.moderation.autoModeration.modules.IPs.reaction
            });
        }
    }

    /*if (guild.configurationManager.configuration.moderation.autoModeration.modules.language.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.language.ignoredChannels.includes(message.channel.id)) {
        let LanguageCheckResult = await require(`./chatModerationModules/languageCheck.js`).languageDetect(client, message, guild);
        if (LanguageCheckResult.result) {
            violations.push({
                check: `languagedetect`,
                trigger: "Wrong Language",
                value: LanguageCheckResult.value,
                action: guild.configurationManager.configuration.moderation.autoModeration.modules.language.reaction
            });
        }
    }*/

    if ((guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.wordsDetection.ignoredChannels.includes(message.channel.id)) ||
        (guild.configurationManager.configuration.moderation.autoModeration.modules.scams.status && !guild.configurationManager.configuration.moderation.autoModeration.modules.scams.ignoredChannels.includes(message.channel.id))) {
        let customDetect = await require(`./chatModerationModules/detectProfanities`).detectProfanities(client, message, guild, {
            terms: guild.configurationManager.configuration.moderation.autoModeration.modules.scams.terms,
            slashes: guild.configurationManager.configuration.moderation.autoModeration.modules.scams.slashes
        });
        if (customDetect.length != 0)
            for (const element of customDetect) {
                violations.push({
                    check: `custom`,
                    trigger: element.trigger,
                    value: element.value,
                    action: element.action
                });
            }
    }

    if (violations.length != 0) {
        messageMetric.addEntry(`ChatViolationSummary`);
        let triggers = uniq_fast(violations.map(violation => violation.trigger));
        let values = uniq_fast(violations.map(violation => violation.value));
        let actions = [];
        violations.forEach(violation => violation.action.forEach(action => actions.push(action)));
        actions = uniq_fast(actions);
        actions.sort((a, b) => {
            let comparaisonValues = {
                "ban": 0,
                "kick": 1,
                "mute": 2,
                "warn": 3,
                "delete": 4,
                "alert": 5,
                "log": 6
            };
            return comparaisonValues[a] - comparaisonValues[b];
        });

        let user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(_e => {
            return false;
        });

        if (actions.includes('delete')) message.delete().catch(e => {
            MainLog.error(`[chatModeration] Could not deleted message. ${e.toString()}`);
        });
        if (actions.includes('ban')) {
            guild.banUser(message, user.id, guild.configurationManager.configuration.moderation.autoModeration.banReason, guild.configurationManager.configuration.moderation.autoModeration.banDuration * 60, true, true);
        } else if (actions.includes('kick')) {
            guild.kickUser(message, user.id, guild.configurationManager.configuration.moderation.autoModeration.kickReason, undefined, true, true);
        } else if (actions.includes('mute')) {
            guild.muteUser(message, user.id, guild.configurationManager.configuration.moderation.autoModeration.muteReason, guild.configurationManager.configuration.moderation.autoModeration.muteDuration * 60, true, true);
        } else if (actions.includes('warn')) {
            guild.warnUser(message, user.id, guild.configurationManager.configuration.moderation.autoModeration.warnReason, undefined, true, true);
        }

        let mainAction = actions.shift();
        let actionString = `, ${actions.join(', ')}`;
        if (mainAction == "log" || actions.includes('log') || actions.includes('log')) {
            AutoModLog.log(`[AutoMod]Message with ${violations.length} violations detected from ${user.user.tag} in ${message.channel.id}@${message.channel.guild.id} [${mainAction}][${actions.join(', ')}][${triggers.join(', ')}] => [${values.join(', ')}]`);
            guild.moderationManager.sendAutoModEmbed(message, guild, `\`${triggers.join('`, `')}\``, `**${mainAction}**${(actions.length != 0) ? actionString : ""}`, user, values, actions.includes('alert'));
        }
        messageMetric.addEntry(`ChatViolationSummaryDone`);
    }
    messageMetric.addEntry(`ChatModerationDone`);
}

function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = a[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}