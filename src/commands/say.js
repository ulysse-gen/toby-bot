const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    MainLog,
    globalPermissions
} = require(`../../index`);

module.exports = {
    name: "say",
    description: `Make me say something.`,
    aliases: [],
    permission: `commands.say`,
    nestedPermissions: {
        inline: `commands.say.inline`,
        toggle: `commands.say.toggle`,
        acrossChannel: `commands.say.acrosschannel.channelId`,
        noLogs: `commands.say.nologs`
    },
    category: `fun`,
    async exec(client, message, args, guild = undefined) {
        let OGMessage = message;
        if (typeof guild.waitingForMessage.data.say[message.author.id] == "undefined") guild.waitingForMessage.data.say[message.author.id] = {
            toggle: false,
            content: undefined,
            channel: undefined,
            noLogs: false
        };
        let embed = new MessageEmbed({
            title: `Tell me what to say !`,
            color: guild.configuration.colors.main
        });

        if (typeof args[0] != undefined) {
            let waitForChannel = new Promise((res, rej) => {
                if (args.length == 0) res(true);
                let control = args.length;
                args.forEach(async invividualArgument => {
                    if (invividualArgument.toLowerCase().startsWith(`channelid:`) || invividualArgument.toLowerCase().startsWith(`-<#`)) {
                        let wantedChannel = (invividualArgument.toLowerCase().startsWith(`channelid:`)) ? invividualArgument.toLowerCase().replace(`channelid:`, ``) : invividualArgument.toLowerCase().replace(`-<#`, ``).slice(0, -1);
                        let permissionToCheck = `${this.nestedPermissions.acrossChannel.replace('channelId', wantedChannel)}`;
                        let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
                        let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

                        if (!hasPermission) {
                            MainLog.log(`${message.author.tag}(${message.author.id}) tried executing 'say' accross channel '${wantedChannel}' [${message.channel.id}][${message.channel.guild.id}][Insufficient Permissions].`); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logOnInsufficientPermissions && guild.logToChannel.initialized) guild.channelLog(`[ERR] <@${message.author.id}>(${message.author.id}) tried executing 'say' accross channel <#${wantedChannel}>(${wantedChannel}) from <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`); //Loggin in log channel if logOnInsufficientPermissions is set & the log channel is initialized
                            if ((typeof guild == "undefined") ? configuration.behaviour.onInsufficientPermissionsIgnore : guild.configuration.behaviour.onInsufficientPermissionsIgnore) res(false); //Stop the command execution here if onInsufficientPermissionsIgnore is enabled
                            let embed = new MessageEmbed({
                                title: `Insufficient Permissions`,
                                color: guild.configuration.colors.error
                            });
                            message.reply({
                                embeds: [embed],
                                failIfNotExists: false
                            }, false).then(msg => {
                                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                                    MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                })
                            }).catch(e => {
                                MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            });
                            res(false);
                        }
                        guild.waitingForMessage.data.say[message.author.id].channel = wantedChannel;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                        res(true);
                    }
                    control--;
                    if (control == 0) res(true);
                });
            });
            let waitingForChannel = await waitForChannel;
            if (waitingForChannel == false) return false;
        }

        let noLogPermissionToCheck = this.nestedPermissions.noLogs;
        let noLogHasGlobalPermission = await globalPermissions.userHasPermission(noLogPermissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let noLogHasPermission = (noLogHasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(noLogPermissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : noLogHasGlobalPermission;

        if (noLogHasPermission) {
            args.forEach(async invividualArgument => {
                if (invividualArgument.toLowerCase() == "-nologs") {
                    guild.waitingForMessage.data.say[message.author.id].noLogs = true;
                    args = args.filter(arrayItem => arrayItem !== invividualArgument);
                }
            });
        }

        if (typeof args[0] != "undefined" && args[0] == "toggle") {
            let permissionToCheck = this.nestedPermissions.toggle;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) {
                MainLog.log(`${message.author.tag}(${message.author.id}) tried executing '${message.content}' in [${message.channel.id}][${message.channel.guild.id}][Insufficient Permissions].`); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logOnInsufficientPermissions && guild.logToChannel.initialized) guild.channelLog(`[ERR] <@${message.author.id}>(${message.author.id}) tried to execute \`${message.content}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`); //Loggin in log channel if logOnInsufficientPermissions is set & the log channel is initialized
                if ((typeof guild == "undefined") ? configuration.behaviour.onInsufficientPermissionsIgnore : guild.configuration.behaviour.onInsufficientPermissionsIgnore) return true; //Stop the command execution here if onInsufficientPermissionsIgnore is enabled
                let embed = new MessageEmbed({
                    title: `Insufficient Permissions`,
                    color: guild.configuration.colors.error
                });
                message.reply({
                    embeds: [embed],
                    failIfNotExists: false
                }, false).then(msg => {
                    if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                        MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    })
                }).catch(e => {
                    MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
                return false;
            }

            if (guild.waitingForMessage.data.say[message.author.id].toggle) {
                clearPending(guild, message);
                embed.title = `Say toggled off`;
                message.reply({
                    embeds: [embed],
                    failIfNotExists: false
                }, false).catch(e => {
                    MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
                return (typeof guild.waitingForMessage.data.say[message.author.id].noLogs != "undefined" && guild.waitingForMessage.data.say[message.author.id].noLogs == true) ? {
                    dontLog: true
                } : false;
            } else {
                guild.waitingForMessage.data.say[message.author.id].toggle = true;
                embed.title = `Say toggled on`;
            }
        }

        if (typeof args[0] != "undefined" && args[0] != "toggle") {
            let permissionToCheck = this.nestedPermissions.inline;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

            if (!hasPermission) {
                MainLog.log(`${message.author.tag}(${message.author.id}) tried executing '${message.content}' in [${message.channel.id}][${message.channel.guild.id}][Insufficient Permissions].`); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logOnInsufficientPermissions && guild.logToChannel.initialized) guild.channelLog(`[ERR] <@${message.author.id}>(${message.author.id}) tried to execute \`${message.content}\` in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`); //Loggin in log channel if logOnInsufficientPermissions is set & the log channel is initialized
                if ((typeof guild == "undefined") ? configuration.behaviour.onInsufficientPermissionsIgnore : guild.configuration.behaviour.onInsufficientPermissionsIgnore) return true; //Stop the command execution here if onInsufficientPermissionsIgnore is enabled
                let embed = new MessageEmbed({
                    title: `Insufficient Permissions`,
                    color: guild.configuration.colors.error
                });
                message.reply({
                    embeds: [embed],
                    failIfNotExists: false
                }, false).then(msg => {
                    if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                        MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    })
                }).catch(e => {
                    MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
                return false;
            }

            guild.waitingForMessage.data.say[message.author.id].content = `${args.join(' ')}`;
            if (typeof guild.waitingForMessage.data.say[message.author.id].channel == "undefined") guild.waitingForMessage.data.say[message.author.id].channel = message.channel.id;

            client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                fetchedGuild.channels.fetch(guild.waitingForMessage.data.say[message.author.id].channel).then(fetchedChannel => {
                    fetchedChannel.send(`${guild.waitingForMessage.data.say[message.author.id].content}`).then(msg => {
                        let isAcrossChannel = (fetchedChannel.id != message.channel.id);
                        if (guild.configuration.behaviour.logSaidMessages == true) {
                            if (guild.waitingForMessage.data.say[message.author.id].noLogs) MainLog.log(`${message.author.tag}(${message.author.id}) made me say \`${guild.waitingForMessage.data.say[message.author.id].content}\` in [${guild.waitingForMessage.data.say[message.author.id].channel}@${guild.waitingForMessage.data.say[message.author.id].channel}]`);
                            if (!guild.waitingForMessage.data.say[message.author.id].noLogs && guild.logToChannel.initialized == true && !isAcrossChannel) guild.channelLog(`<@${message.author.id}>(${message.author.id}) made me say \`${guild.waitingForMessage.data.say[message.author.id].content}\` in <#${guild.waitingForMessage.data.say[message.author.id].channel}>(${guild.waitingForMessage.data.say[message.author.id].channel}).`);
                            if (!guild.waitingForMessage.data.say[message.author.id].noLogs && guild.logToChannel.initialized == true && isAcrossChannel) guild.channelLog(`<@${message.author.id}>(${message.author.id}) made me say \`${guild.waitingForMessage.data.say[message.author.id].content}\` in <#${guild.waitingForMessage.data.say[message.author.id].channel}>(${guild.waitingForMessage.data.say[message.author.id].channel}). [Across channel from <#${message.channel.id}>(${message.channel.id})]`);
                        }
                        if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                            clearPending(guild, message);
                    }).catch(e => {
                        MainLog.log(`Could not send message in [${fetchedChannel.id}][${fetchedChannel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message in [<#${fetchedChannel.id}>(${fetchedChannel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                            clearPending(guild, message);
                    });
                }).catch(e => {
                    MainLog.log(`Could not fetch channel [${guild.waitingForMessage.data.say.acrossChannel[message.author.id]}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch channel <#${guild.waitingForMessage.data.say.acrossChannel[message.author.id]}>(${guild.waitingForMessage.data.say.acrossChannel[message.author.id]}) in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                        clearPending(guild, message);
                })
            }).catch(e => {
                MainLog.log(`Could not fetch guild [${message.channel.guild.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild [${message.channel.guild.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                    clearPending(guild, message);
            });
            message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });
            return ((typeof guild.waitingForMessage.data.say[message.author.id].noLogs != "undefined" && guild.waitingForMessage.data.say[message.author.id].noLogs == true)) ? {
                dontLog: true
            } : true;;
        }

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(async msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });

            if (guild.waitingForMessage.data.say[message.author.id].toggle) {
                let permissionToCheck = this.nestedPermissions.toggle;
                let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
                let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

                if (!hasPermission) {
                    clearPending(guild, message);
                    return false;
                }
            }


            if (typeof guild.waitingForMessage.channels == "undefined")guild.waitingForMessage.channels = [];
            if (typeof guild.waitingForMessage.channels[message.channel.id] == "undefined")guild.waitingForMessage.channels[message.channel.id] = [];
            guild.waitingForMessage.channels[message.channel.id][message.author.id] = (message) => {
                if (message.content.startsWith(configuration.globalPrefix) || message.content.startsWith(guild.configuration.prefix)) return (typeof guild.waitingForMessage.data.say[message.author.id].noLogs != "undefined" && guild.waitingForMessage.data.say[message.author.id].noLogs == true) ? {
                    dontLog: true
                } : false;
                if (typeof guild.waitingForMessage.data.say[message.author.id].channel == "undefined") guild.waitingForMessage.data.say[message.author.id].channel = message.channel.id;
                guild.waitingForMessage.data.say[message.author.id].content = message.content;

                client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
                    fetchedGuild.channels.fetch((typeof guild.waitingForMessage.data.say[message.author.id].channel == "undefined") ? message.channel.id : guild.waitingForMessage.data.say[message.author.id].channel).then(fetchedChannel => {
                        fetchedChannel.send(`${guild.waitingForMessage.data.say[message.author.id].content}`).then(msg => {
                            let isAcrossChannel = (fetchedChannel.id != message.channel.id);
                            if (guild.configuration.behaviour.logSaidMessages == true) {
                                if (guild.waitingForMessage.data.say[message.author.id].noLogs) MainLog.log(`${message.author.tag}(${message.author.id}) made me say \`${guild.waitingForMessage.data.say[message.author.id].content}\` in [${guild.waitingForMessage.data.say[message.author.id].channel}@${guild.waitingForMessage.data.say[message.author.id].channel}]`);
                                if (!guild.waitingForMessage.data.say[message.author.id].noLogs && guild.logToChannel.initialized == true && !isAcrossChannel) guild.channelLog(`<@${message.author.id}>(${message.author.id}) made me say \`${guild.waitingForMessage.data.say[message.author.id].content}\` in <#${guild.waitingForMessage.data.say[message.author.id].channel}>(${guild.waitingForMessage.data.say[message.author.id].channel}).`);
                                if (!guild.waitingForMessage.data.say[message.author.id].noLogs && guild.logToChannel.initialized == true && isAcrossChannel) guild.channelLog(`<@${message.author.id}>(${message.author.id}) made me say \`${guild.waitingForMessage.data.say[message.author.id].content}\` in <#${guild.waitingForMessage.data.say[message.author.id].channel}>(${guild.waitingForMessage.data.say[message.author.id].channel}). [Across channel from <#${message.channel.id}>(${message.channel.id})]`);
                            }
                            if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                                clearPending(guild, message);
                        }).catch(e => {
                            MainLog.log(`Could not send message in [${fetchedChannel.id}][${fetchedChannel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message in [<#${fetchedChannel.id}>(${fetchedChannel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                                clearPending(guild, message);
                        });
                    }).catch(e => {
                        MainLog.log(`Could not fetch channel [${guild.waitingForMessage.data.say.acrossChannel[message.author.id]}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch channel <#${guild.waitingForMessage.data.say.acrossChannel[message.author.id]}>(${guild.waitingForMessage.data.say.acrossChannel[message.author.id]}) in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                            clearPending(guild, message);
                    })
                }).catch(e => {
                    MainLog.log(`Could not fetch guild [${message.channel.guild.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild [${message.channel.guild.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    if (!guild.waitingForMessage.data.say[message.author.id].toggle)
                        clearPending(guild, message);
                });
                message.delete().catch(e => {
                    MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
                if (!guild.waitingForMessage.data.say[message.author.id].toggle) {
                    msg.delete().catch(e => {
                        MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                    OGMessage.delete().catch(e => {
                        MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                }
                return true;
            }
        }).catch(e => {
            MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
        });
        return ((typeof guild.waitingForMessage.data.say[message.author.id].noLogs != "undefined" && guild.waitingForMessage.data.say[message.author.id].noLogs == true)) ? {
            dontLog: true
        } : true;
    }
}

function clearPending(guild, message) {
    if (typeof guild.waitingForMessage.channels[message.channel.id] != "undefined")
        if (typeof guild.waitingForMessage.channels[message.channel.id][message.author.id] != "undefined")
            delete guild.waitingForMessage.channels[message.channel.id][message.author.id];
    guild.waitingForMessage.data.say[message.author.id] = {
        toggle: false,
        content: undefined,
        channel: undefined
    };
}