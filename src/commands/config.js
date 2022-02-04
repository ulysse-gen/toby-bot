const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    MainLog
} = require(`../../index`);
var _ = require('lodash');
const utils = require(`../utils`);
const {
    takeRight
} = require('lodash');

var settingsList = {};

module.exports = {
    name: "configuration",
    description: `Edit the configuration`,
    aliases: ["config", "conf"],
    permission: `commands.configuration`,
    category: `administration`,
    async exec(client, message, args, guild = undefined) {
        let defaultConfig = require(`../../configurations/default/configuration.json`);

        settingsList = {
            Global: {
                prefix: {
                    title: `Prefix`,
                    description: `Set the prefix for my commands`,
                    configName: `prefix`,
                    path: `prefix`
                },
                colorsSuccess: {
                    title: `Success color`,
                    description: `Define the color for the success embeds`,
                    configName: `successColor`,
                    path: `colors.success`
                },
                colorsError: {
                    title: `Error color`,
                    description: `Define the color for the error embeds`,
                    configName: `errorColor`,
                    path: `colors.error`
                },
                colorsWarning: {
                    title: `Warning color`,
                    description: `Define the color for the warning embeds`,
                    configName: `warningColor`,
                    path: `colors.warning`
                },
                colorsMain: {
                    title: `Main color`,
                    description: `Define the color for the main embeds`,
                    configName: `mainColor`,
                    path: `colors.main`
                }
            },
            Behaviour: {
                behaviourOnCommandErrorIgnore: {
                    title: `Ignore on command error`,
                    description: `Should we ignore commands error ? (Or should we reply with an error)`,
                    configName: `onCommandErrorIgnore`,
                    path: `behaviour.onCommandErrorIgnore`
                },
                behaviourOnCommandDeniedIgnore: {
                    title: `Ignore on command denied`,
                    description: `Should we ignore commands denied ? (Or should we reply with a command denied error)`,
                    configName: `onCommandDeniedIgnore`,
                    path: `behaviour.onCommandDeniedIgnore`
                },
                behaviourOnUnknownCommandIgnore: {
                    title: `Ignore on unknown command`,
                    description: `Should we ignore unknown commands ? (Or should we reply with a unknown command error)`,
                    configName: `onUnknownCommandIgnore`,
                    path: `behaviour.onUnknownCommandIgnore`
                },
                behaviourOnWarningIgnore: {
                    title: `Ignore on warning`,
                    description: `Should we ignore warnings ? (Or should we reply with a warning)`,
                    configName: `onWarningIgnore`,
                    path: `behaviour.onWarningIgnore`
                },
                behaviourAutoDeleteCommands: {
                    title: `Auto delete commands`,
                    description: `Should we auto delete commands trigger ?`,
                    configName: `autoDeleteCommands`,
                    path: `behaviour.autoDeleteCommands`
                },
                behaviourLogOnCommandError: {
                    title: `Log on command error`,
                    description: `Should the command errors be logged in the log channel ?`,
                    configName: `logOnCommandError`,
                    path: `behaviour.logOnCommandError`
                },
                behaviourLogOnCommandDenied: {
                    title: `Log on command denied`,
                    description: `Should the command denied be logged in the log channel ?`,
                    configName: `logOnCommandDenied`,
                    path: `behaviour.logOnCommandDenied`
                },
                behaviourLogOnUnknownCommand: {
                    title: `Log on unknown command`,
                    description: `Should the unknown command be logged in the log channel ?`,
                    configName: `logOnUnknownCommand`,
                    path: `behaviour.logOnUnknownCommand`
                },
                behaviourLogOnWarning: {
                    title: `Log on warning`,
                    description: `Should the warnings be logged in the log channel ?`,
                    configName: `logOnWarning`,
                    path: `behaviour.logOnWarning`
                },
                behaviourLogDiscordErrors: {
                    title: `Log on discord error`,
                    description: `Should the discord errors be logged in the log channel ?`,
                    configName: `logDiscordErrors`,
                    path: `behaviour.logDiscordErrors`
                },
                behaviourLogCommandExecutions: {
                    title: `Log on command executions`,
                    description: `Should the command executions be logged in the log channel ?`,
                    configName: `logCommandExecutions`,
                    path: `behaviour.logCommandExecutions`
                },
                behaviourLogSaidMessages: {
                    title: `Log said messages`,
                    description: `Should the messages sent by the say command be logged in the log channel ?`,
                    configName: `logSaidMessages`,
                    path: `behaviour.logSaidMessages`
                }/*,
                behaviourSendConfigInEmbed: {
                    title: `Send config in embed`,
                    description: `Should the config command be using embed ?`,
                    configName: `sendConfigInEmbed`,
                    path: `behaviour.sendConfigInEmbed`
                }*/,
                behaviourLogToChannelStatus: {
                    title: `Log to channel`,
                    description: `Enable the logging to channel`,
                    configName: `logToChannel`,
                    path: `behaviour.logToChannel.status`,
                    checkerFunction: async (newValue) => {
                        if (newValue == true && guild.configuration.behaviour.logToChannel.channel == defaultConfig.behaviour.logToChannel.channel) return {
                            break: true,
                            title: "Set the logging channel before enabling.",
                            description: `Use \`${guild.configuration.prefix}conf set channelToLogTo <#ChannelId>\` to enable !`
                        };
                        let GuildAndChannelCheck = new Promise((res, rej) => {
                            client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                                fetchedGuild.channels.fetch(guild.configuration.behaviour.logToChannel.channel).then(channel => {
                                    res({
                                        break: false
                                    });
                                }).catch(e => {
                                    if (guild.configuration.behaviour.logToChannel.status == true) guild.configuration.behaviour.logToChannel.status = false;
                                    res({
                                        break: true,
                                        title: "Failed to enable",
                                        description: `Could not fetch the channel set as logging channel. Fix permissions or update it using \`${guild.configuration.prefix}conf set channelToLogTo <#ChannelId>\``
                                    });
                                });
                            }).catch(e => {
                                if (guild.configuration.behaviour.logToChannel.status == true) guild.configuration.behaviour.logToChannel.status = false;
                                res({
                                    break: true,
                                    title: "Error",
                                    description: "Could not find the guild."
                                });
                            });
                        });
                        let GuildAndChannelCheckResult = await GuildAndChannelCheck;
                        return GuildAndChannelCheckResult;
                    },
                    runAfter: async (newValue) => {
                        await guild.initChannelLogging();
                    }
                },
                behaviourLogToChannelChannel: {
                    title: `Channel to log to`,
                    description: `Choose what channel you want the bot to log to`,
                    configName: `channelToLogTo`,
                    path: `behaviour.logToChannel.channel`,
                    checkerFunction: async (newValue) => {
                        if (newValue == true && guild.configuration.behaviour.logToChannel.channel == defaultConfig.behaviour.logToChannel.channel) return {
                            break: true,
                            title: "Set the logging channel before enabling.",
                            description: `Use \`${guild.configuration.prefix}conf set channelToLogTo <#ChannelId>\` to enable !`
                        };
                        if (newValue.startsWith(`<#`)) newValue = newValue.replace('<#', '').slice(0, -1);
                        let GuildAndChannelCheck = new Promise((res, rej) => {
                            client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                                fetchedGuild.channels.fetch(newValue).then(channel => {
                                    res({
                                        break: false,
                                        adjustValue: newValue
                                    });
                                }).catch(e => {
                                    if (guild.configuration.behaviour.logToChannel.status == true) guild.configuration.behaviour.logToChannel.status = false;
                                    res({
                                        break: true,
                                        title: "Failed to enable",
                                        description: `Could not fetch the channel set as logging channel. Fix permissions or update it using \`${guild.configuration.prefix}conf set channelToLogTo <#ChannelId>\``
                                    });
                                });
                            }).catch(e => {
                                if (guild.configuration.behaviour.logToChannel.status == true) guild.configuration.behaviour.logToChannel.status = false;
                                res({
                                    break: true,
                                    title: "Error",
                                    description: "Could not find the guild."
                                });
                            });
                        });
                        let GuildAndChannelCheckResult = await GuildAndChannelCheck;
                        return GuildAndChannelCheckResult;
                    },
                    runAfter: async (newValue) => {
                        await guild.initChannelLogging();
                    }
                },
                behaviourLogToChannelFormat: {
                    title: `Format for log`,
                    description: `Choose what format you want to server to log with placeholders.`,
                    configName: `logFormat`,
                    path: `behaviour.logToChannel.format`
                }
            },
            Moderation: {
                moderationLogToChannelStatus: {
                    title: `Log moderation to channel`,
                    description: `Enable the moderation logging to channel`,
                    configName: `logModerationToChannel`,
                    path: `moderation.logToChannel.status`,
                    checkerFunction: async (newValue) => {
                        if (newValue == true && guild.configuration.moderation.logToChannel.channel == defaultConfig.moderation.logToChannel.channel) return {
                            break: true,
                            title: "Set the moderation logging channel before enabling.",
                            description: `Use \`${guild.configuration.prefix}conf set channelToLogModerationTo <#ChannelId>\` to enable !`
                        };
                        let GuildAndChannelCheck = new Promise((res, rej) => {
                            client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                                fetchedGuild.channels.fetch(guild.configuration.moderation.logToChannel.channel).then(channel => {
                                    res({
                                        break: false
                                    });
                                }).catch(e => {
                                    if (guild.configuration.moderation.logToChannel.status == true) guild.configuration.moderation.logToChannel.status = false;
                                    res({
                                        break: true,
                                        title: "Failed to enable",
                                        description: `Could not fetch the channel set as moderation logging channel. Fix permissions or update it using \`${guild.configuration.prefix}conf set channelToLogModerationTo <#ChannelId>\``
                                    });
                                });
                            }).catch(e => {
                                if (guild.configuration.moderation.logToChannel.status == true) guild.configuration.moderation.logToChannel.status = false;
                                res({
                                    break: true,
                                    title: "Error",
                                    description: "Could not find the guild."
                                });
                            });
                        });
                        let GuildAndChannelCheckResult = await GuildAndChannelCheck;
                        return GuildAndChannelCheckResult;
                    },
                    runAfter: async (newValue) => {
                        await guild.initModerationLogging();
                    }
                },
                moderationLogToChannelChannel: {
                    title: `Channel to log moderation to`,
                    description: `Choose what channel you want the bot to log moderation to`,
                    configName: `channelToLogModerationTo`,
                    path: `moderation.logToChannel.channel`,
                    checkerFunction: async (newValue) => {
                        if (newValue == true && guild.configuration.moderation.logToChannel.channel == defaultConfig.moderation.logToChannel.channel) return {
                            break: true,
                            title: "Set the moderation logging channel before enabling.",
                            description: `Use \`${guild.configuration.prefix}conf set channelToLogTo <#ChannelId>\` to enable !`
                        };
                        if (newValue.startsWith(`<#`)) newValue = newValue.replace('<#', '').slice(0, -1);
                        let GuildAndChannelCheck = new Promise((res, rej) => {
                            client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                                fetchedGuild.channels.fetch(newValue).then(channel => {
                                    res({
                                        break: false,
                                        adjustValue: newValue
                                    });
                                }).catch(e => {
                                    if (guild.configuration.moderation.logToChannel.status == true) guild.configuration.moderation.logToChannel.status = false;
                                    res({
                                        break: true,
                                        title: "Failed to enable",
                                        description: `Could not fetch the channel set as moderation logging channel. Fix permissions or update it using \`${guild.configuration.prefix}conf set channelToLogModerationTo <#ChannelId>\``
                                    });
                                });
                            }).catch(e => {
                                if (guild.configuration.moderation.logToChannel.status == true) guild.configuration.moderation.logToChannel.status = false;
                                res({
                                    break: true,
                                    title: "Error",
                                    description: "Could not find the guild."
                                });
                            });
                        });
                        let GuildAndChannelCheckResult = await GuildAndChannelCheck;
                        return GuildAndChannelCheckResult;
                    },
                    runAfter: async (newValue) => {
                        await guild.initModerationLogging();
                    }
                },
                moderationKickNeedReason: {
                    title: `Kick need reason`,
                    description: `Should the kicks need a reason ?`,
                    configName: `kickNeedReason`,
                    path: `moderation.kickNeedReason`
                },
                moderationBanNeedReason: {
                    title: `Ban need reason`,
                    description: `Should the bans need a reason ?`,
                    configName: `banNeedReason`,
                    path: `moderation.banNeedReason`
                },
                moderationMuteNeedReason: {
                    title: `Mute need reason`,
                    description: `Should the mutes need a reason ?`,
                    configName: `muteNeedReason`,
                    path: `moderation.muteNeedReason`
                },
                moderationUnbanNeedReason: {
                    title: `Unban need reason`,
                    description: `Should the unbans need a reason ?`,
                    configName: `unbanNeedReason`,
                    path: `moderation.unbanNeedReason`
                },
                moderationUnmuteNeedReason: {
                    title: `Unmute need reason`,
                    description: `Should the unmutes need a reason ?`,
                    configName: `unmuteNeedReason`,
                    path: `moderation.unmuteNeedReason`
                },
                moderationSendBanAlertInDM: {
                    title: `Send ban alert in DM`,
                    description: `Should the bot alert the member in DMs about their ban ?`,
                    configName: `sendBanAlertInDM`,
                    path: `moderation.sendBanAlertInDM`
                },
                moderationSendKickAlertInDM: {
                    title: `Send kick alert in DM`,
                    description: `Should the bot alert the member in DMs about their kick ?`,
                    configName: `sendKickAlertInDM`,
                    path: `moderation.sendKickAlertInDM`
                },
                moderationSendMuteAlertInDM: {
                    title: `Send mute alert in DM`,
                    description: `Should the bot alert the member in DMs about their mute ?`,
                    configName: `sendMuteAlertInDM`,
                    path: `moderation.sendMuteAlertInDM`
                },
                moderationSendWarnAlertInDM: {
                    title: `Send warn alert in DM`,
                    description: `Should the bot alert the member in DMs about their warn ?`,
                    configName: `sendWarningInDM`,
                    path: `moderation.sendWarningInDM`
                },
                moderationMuteRole: {
                    title: `Define the muted role`,
                    description: `What role should be used to mute people ?`,
                    configName: `muteRole`,
                    path: `moderation.muteRole`
                }
            }
        }

        if (args.length == 0 || args[0] == "help") {
            if (!guild.configuration.behaviour.sendConfigInEmbed) {
                let response = "**Main Configuation Helper**";

                response += "\nHow to use : *(<Needed Parameter> [Optionnal Parameter])*"
                response += `\n\`${guild.configuration.prefix}configuration show/infos <setting>\` *shows info and help about a setting.*`;
                response += `\n\`${guild.configuration.prefix}configuration set <setting> <value>\` *set the current value of a setting.*`;
                response += `\n\`${guild.configuration.prefix}configuration reset/unset/default <setting>\` *set the current value of a setting to its default value.*`;
                response += `\nJust to make it clear : Should we \`x\` ? => true = yes it should act like this`;
                response += `\nDue to discord 2000(or 4000 idk discord is terrible) character limit, the message will be sent in blocks.`;

                for (let settingsCat in settingsList) {
                    response += `|||MESSAGE SPLITTER|||  **${settingsCat}**`;
                    for (let settingParam in settingsList[settingsCat]) {
                        settingParam = settingsList[settingsCat][settingParam];
                        response += `\n\`${settingParam.configName}\`: *${settingParam.description}* [Default: \`${_.get(defaultConfig, settingParam.path)}\`][Current: \`${guild.configurationManager.get(settingParam.path)}\`]||SPLIT HERE IF NEEDED||`
                    }
                }

                let responseSplitted = response.split('|||MESSAGE SPLITTER|||');
                let firstResponse = responseSplitted.shift();

                message.reply(`${firstResponse}`, false).then(msg => {
                    if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                }).catch(e => utils.messageReplyFailLogger(message, guild, e));

                responseSplitted.forEach(indRep => {
                    indRep = indRep.replaceAll('||SPLIT HERE IF NEEDED||', '');
                    if (indRep.length > 2000) {
                        let responseChunks = [];
                        let indRepNew = ``;
                        let indRepSplitting = splitToSubstrings(indRep, 2000)
                        indRepSplitting.forEach(indRepSplittingg => {
                            indRepSplittingg = indRepSplittingg.split('').reverse().join('').replace('||SPLIT HERE IF NEEDED||'.split('').reverse().join(''), '||MESSAGE SPLITTER||'.split('').reverse().join('')).split('').reverse().join('');
                            console.log(`${`Response part`.red} => "${indRepSplittingg}" ${`(Length => ${indRepSplittingg.length})`.blue}`);
                            indRepNew += indRepSplittingg;
                        });
                        responseChunks = indRepNew.split('||MESSAGE SPLITTER||');
                        responseChunks.forEach(responseChunk => {
                            if (!(responseChunk.length <= 0) || !(responseChunk.length > 2000)) message.channel.send(`${responseChunk}`, false).then(msg => {
                                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
                        });
                        return;
                    }
                    message.channel.send(`${indRep}`, false).then(msg => {
                        if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
                    }).catch(e => utils.messageReplyFailLogger(message, guild, e));
                });
                return true;
            }
            let embedFields = [];
            let embedPages = [];

            let embed = new MessageEmbed({
                title: `Main Configuation Helper`,
                color: guild.configuration.colors.main
            });

            embed.description = "\nHow to use : *(<Needed Parameter> [Optionnal Parameter])*"
            embed.description += `\n\`${guild.configuration.prefix}configuration show/infos <setting>\` *shows info and help about a setting.*`;
            embed.description += `\n\`${guild.configuration.prefix}configuration set <setting> <value>\` *set the current value of a setting.*`;
            embed.description += `\n\`${guild.configuration.prefix}configuration reset/unset/default <setting>\` *set the current value of a setting to its default value.*`;
            embed.description += `\nJust to make it clear : Should we \`x\` ? => true = yes it should act like this`;

            for (let settingsCat in settingsList) {
                for (let settingParam in settingsList[settingsCat]) {
                    settingParam = settingsList[settingsCat][settingParam];
                    embedFields.push([`**${settingParam.configName}**`, `Description: ${settingParam.description}\nDefault: \`${_.get(defaultConfig, settingParam.path)}\`\nCurrent: \`${guild.configurationManager.get(settingParam.path)}\``, false]);
                }
            }


            if (embedFields.length > 10) {
                embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
                embed.footer = {
                    text: `Use \`${guild.configuration.prefix}conf help [page number]\` to search thru pages. [1/${embedPages.length}]`
                };
            }

            embedFields = embedPages[0];
            if (args.length == 2) {
                try {
                    args[1] = parseInt(args[1]);
                } catch (e) {
                    return utils.sendError(message, guild, `Pages must be selected by numbers.`);
                }
                embed.footer = {
                    text: `Use \`${guild.configuration.prefix}conf help [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
                };
                if (typeof embedPages[args[1] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`);
                embedFields = embedPages[args[1] - 1];
            }

            embedFields.forEach(embedField => {
                embed.addField(embedField[0], embedField[1], embedField[2]);
            });
    
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        if (args[0] == "show" || args[0] == "infos") {
            if (args.length != 2) return utils.sendError(message, guild, `Error`, `Wrong command synthax. This command must have this synthax : \`${guild.configuration.prefix}configuration show/infos <setting>\``);
            let setting = getConfigByName(args[1]);
            if (typeof setting == "undefined") return utils.sendError(message, guild, `Error`, `Unknown setting \`${args[1]}\``);
            let embedFields = [];
            embedFields.push([`**Name:**`, `${setting.title}`, false]);
            embedFields.push([`**Description:**`, `${setting.description}`, false]);
            embedFields.push([`**Default Value:**`, `${_.get(defaultConfig, setting.path)}`, true]);
            embedFields.push([`**Current Value:**`, `${_.get(guild.configuration, setting.path)}`, true]);
            embedFields.push([`**Value Type:**`, `${(typeof _.get(defaultConfig, setting.path)).toString()}`, true]);
            await guild.configurationManager.save();
            return utils.sendMain(message, guild, `\`${args[1]}\` setting infos :`, undefined, undefined, undefined, embedFields);
        }

        if (args[0] == "set") {
            if (args.length != 3) return utils.sendError(message, guild, `Error`, `Wrong command synthax. This command must have this synthax : \`${guild.configuration.prefix}configuration set <setting> <value>\``);
            let setting = getConfigByName(args[1]);
            if (typeof setting == "undefined") return utils.sendError(message, guild, `Error`, `Unknown setting \`${args[1]}\``);
            let value = args[2];
            if (typeof _.get(defaultConfig, setting.path) == "boolean") {
                value = (value == '1' || value == "true" || value == "yes") ? true : false;
            }
            if (typeof _.get(defaultConfig, setting.path) == "number") {
                value = Number(args[2]);
                if (isNaN(value)) return utils.sendError(message, guild, `Error`, `The value must be a ${(typeof _.get(defaultConfig, setting.path).toString())}, received ${typeof value}. [Wrong value \`${value}\`]`);
            }

            if (typeof setting.checkerFunction == "function") {
                checkUpResult = await setting.checkerFunction(value);
                if (checkUpResult.break) return utils.sendError(message, guild, `${checkUpResult.title}`, `${checkUpResult.description}`);
                if (typeof checkUpResult.title == "string" || typeof checkUpResult.description == "string") utils.sendMain(message, guild, `${checkUpResult.title}`, `${checkUpResult.description}`);
            }

            let oldValue = value;
            if (typeof setting.checkerFunction == "function" && typeof checkUpResult.adjustValue != "undefined") value = checkUpResult.adjustValue;

            await guild.configurationManager.set(setting.path, value);

            if (typeof setting.runAfter == "function") await setting.runAfter(value);

            await guild.configurationManager.save();
            return utils.sendSuccess(message, guild, `Value set`, `${setting.title} now set to ${value}`);
        }

        if (args[0] == "reset" || args[0] == "unset" || args[0] == "default") {
            if (args.length != 2) return utils.sendError(message, guild, `Error`, `Wrong command synthax. This command must have this synthax : \`${guild.configuration.prefix}configuration reset/unset/default <setting>\``);
            let setting = getConfigByName(args[1]);
            if (typeof setting == "undefined") return utils.sendError(message, guild, `Error`, `Unknown setting \`${args[1]}\``);
            await guild.configurationManager.set(setting.path, _.get(defaultConfig, setting.path));
            await guild.configurationManager.save();
            return utils.sendSuccess(message, guild, `Value reset`, `${setting.title} now reset to ${_.get(defaultConfig, setting.path)}`);
        }

        return utils.sendError(message, guild, `Unknown subcommand`, `The command you typed seems wrong. Command format : \`${guild.configuration.prefix}configuration <subcommand> <setting> [options]\``);
    }
}


function splitToSubstrings(str, n) {
    const arr = [];

    for (let index = 0; index < str.length; index += n) {
        arr.push(str.slice(index, index + n));
    }

    return arr;
}

function getConfigByName(configName) {
    for (let settingsCat of Object.keys(settingsList)) {
        for (let settingsItem of Object.keys(settingsList[settingsCat])) {
            if (settingsList[settingsCat][settingsItem].configName == configName) return settingsList[settingsCat][settingsItem];
        }
    }
    return undefined;
}

function splitArrayIntoChunksOfLen(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}