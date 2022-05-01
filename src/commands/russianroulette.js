var rn = require("random-number");
const timestring = require('timestring')
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require(`discord.js`);
const utils = require(`../utils`);
const {
    globalConfiguration,
    MainLog,
    globalPermissions
} = require(`../../index`);

module.exports = {
    name: "russianroulette",
    description: `Russian Roulette`,
    aliases: ["rr"],
    permission: `commands.russianroulette`,
    category: `fun`,
    nestedPermissions: {
        trigger: "commands.russianroulette.trigger",
        custom: "commands.russianroulette.customsettings",
        stop: "commands.russianroulette.stop",
        cancel: "commands.russianroulette.cancel",
        join: "commands.russianroulette.join",
        rig: "commands.russianroulette.rig",
        sike: "commands.russianroulette.sike"
    },
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id] != "undefined") return utils.sendError(message, guild, `A Russian Roulette is already running.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/

        const premadePrizes = {
            muted1min: {
                name: "Muted One Minute",
                key: "muted1min",
                run: async (user) => {
                    let isUserAlreadyMuted = await guild.moderationManager.isUserPunished(user.id, guild.guild.id, 'Mute');
                    if (isUserAlreadyMuted) {
                        message.channel.send(`Well <@${user.id}> should have been muted but.. Is already. F`);
                        return true;
                    }
                    message.channel.send(`Enjoy your 1 minute mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `[RR Auto] Won the Russian Roulette`, 1 * 60);
                }
            },
            muted5min: {
                name: "Muted Five Minutes",
                key: "muted5min",
                run: async (user) => {
                    let isUserAlreadyMuted = await guild.moderationManager.isUserPunished(user.id, guild.guild.id, 'Mute');
                    if (isUserAlreadyMuted) {
                        message.channel.send(`Well <@${user.id}> should have been muted but.. Is already. F`);
                        return true;
                    }
                    message.channel.send(`Enjoy your 5 minutes mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `[RR Auto]Won the Russian Roulette`, 5 * 60);
                }
            },
            muted10min: {
                name: "Muted Ten Minutes",
                key: "muted10min",
                run: async (user) => {
                    let isUserAlreadyMuted = await guild.moderationManager.isUserPunished(user.id, guild.guild.id, 'Mute');
                    if (isUserAlreadyMuted) {
                        message.channel.send(`Well <@${user.id}> should have been muted but.. Is already. F`);
                        return true;
                    }
                    message.channel.send(`Enjoy your 10 minutes mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `[RR Auto]Won the Russian Roulette`, 10 * 60);
                }
            },
            muted15min: {
                name: "Muted 15 Minutes",
                key: "muted15min",
                run: async (user) => {
                    let isUserAlreadyMuted = await guild.moderationManager.isUserPunished(user.id, guild.guild.id, 'Mute');
                    if (isUserAlreadyMuted) {
                        message.channel.send(`Well <@${user.id}> should have been muted but.. Is already. F`);
                        return true;
                    }
                    message.channel.send(`Enjoy your 15 minutes mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `[RR Auto]Won the Russian Roulette`, 30 * 60);
                }
            },
            muted30min: {
                name: "Muted 30 Minutes",
                key: "muted30min",
                run: async (user) => {
                    let isUserAlreadyMuted = await guild.moderationManager.isUserPunished(user.id, guild.guild.id, 'Mute');
                    if (isUserAlreadyMuted) {
                        message.channel.send(`Well <@${user.id}> should have been muted but.. Is already. F`);
                        return true;
                    }
                    message.channel.send(`Enjoy your 30 minutes mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `[RR Auto]Won the Russian Roulette`, 30 * 60);
                }
            },
            muted1h: {
                name: "Muted One Hour",
                key: "muted1h",
                run: async (user) => {
                    let isUserAlreadyMuted = await guild.moderationManager.isUserPunished(user.id, guild.guild.id, 'Mute');
                    if (isUserAlreadyMuted) {
                        message.channel.send(`Well <@${user.id}> should have been muted but.. Is already. F`);
                        return true;
                    }
                    message.channel.send(`Enjoy your 1 hour mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `[RR Auto]Won the Russian Roulette`, 60 * 60);
                }
            }
        }

        if (args.length != 0 && args[0].toLowerCase() == "prizes") {
            let embed = new MessageEmbed({
                title: `Russian roulette prizes :`,
                color: guild.configurationManager.configuration.colors.main
            });
            for (const key in premadePrizes) {
                embed.addField(`${premadePrizes[key].name}`, `t!rr -prize:${key}`, true);
            }
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }

        guild.waitingForInteraction.data.russianroulette[message.channel.id] = {
            players: [],
            playersDisplay: [],
            alivePlayers: [],
            deadPlayers: [],
            prize: undefined,
            prizeObject: undefined,
            winners: 1,
            status: "joining",
            startTimer: 30000,
            roundTimer: 9000,
            intervals: [],
            timeouts: [],
            cannotDie: [],
            sike: undefined
        };

        let customPermission = this.nestedPermissions.custom;
        let hasCustomPermissionGlobalPermission = await globalPermissions.userHasPermission(customPermission, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let hasCustomPermission = (hasCustomPermissionGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(customPermission, message.author.id, undefined, message.channel.id, message.guild.id) : hasCustomPermissionGlobalPermission;

        let rigPermission = this.nestedPermissions.custom;
        let hasRigPermissionGlobalPermission = await globalPermissions.userHasPermission(rigPermission, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let hasRigPermission = (hasRigPermissionGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(rigPermission, message.author.id, undefined, message.channel.id, message.guild.id) : hasCustomPermissionGlobalPermission;

        if (hasCustomPermission) {
            args.forEach(async invividualArgument => {
                if (invividualArgument.toLowerCase().startsWith("-starttimer:")) {
                    try {
                        let time = parseInt(invividualArgument.replace('-starttimer:', ``));
                        guild.waitingForInteraction.data.russianroulette[message.channel.id].startTimer = time * 1000;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-roundtimer:")) {
                    try {
                        let time = parseInt(invividualArgument.replace('-roundtimer:', ``));
                        guild.waitingForInteraction.data.russianroulette[message.channel.id].roundTimer = (time * 1000 > guild.waitingForInteraction.data.russianroulette[message.channel.id].roundTimer) ? time * 1000 : guild.waitingForInteraction.data.russianroulette[message.channel.id].roundTimer;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-winners:")) {
                    try {
                        let amount = parseInt(invividualArgument.replace('-winners:', ``));
                        guild.waitingForInteraction.data.russianroulette[message.channel.id].winners = amount;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (hasRigPermission)
                    if (invividualArgument.toLowerCase().startsWith("-rigged:")) {
                        try {
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].cannotDie = invividualArgument.replace('-rigged:', ``).split(',');
                            args = args.filter(arrayItem => arrayItem !== invividualArgument);
                        } catch (e) {}
                    }
                if (invividualArgument.toLowerCase().startsWith("-notriggedatall:")) {
                    try {
                        guild.waitingForInteraction.data.russianroulette[message.channel.id].cannotDie = invividualArgument.replace('-notriggedatall:', ``).split(',');
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-sike:")) {
                    try {
                        guild.waitingForInteraction.data.russianroulette[message.channel.id].sike = invividualArgument.replace('-sike:', ``);
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-prize:")) {
                    try {
                        let prize = invividualArgument.replace('-prize:', ``);
                        if (typeof premadePrizes[prize] != "undefined") {
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].prize = premadePrizes[prize].name;
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].prizeObject = premadePrizes[prize];
                        } else {
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].prize = prize.replaceAll('_', ' ');
                        }
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
            });
        }

        if (args.length != 0) {
            clearPending(guild, message);
            return utils.sendError(message, guild, `Unknown argument used`, `Command is \`t!rr [prizes] [-prize:prizeName] [-starttimer:startTimeSeconds] [-winners:winnersAmount]\``, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }

        let embed = new MessageEmbed({
            title: `The Russian Roulette will start in ${guild.waitingForInteraction.data.russianroulette[message.channel.id].startTimer/1000} seconds`,
            color: guild.configurationManager.configuration.colors.main,
            description: `**Click** on the **join button** below to join the **Russian Roulette** %prize%\nCurrent players [%player_amount%]: %player_list%`
                .replaceAll(`%player_amount%`, `0`)
                .replaceAll(`%player_list%`, ``)
                .replaceAll(`%prize%`, (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prize != "undefined") ? `and try to win : **${guild.waitingForInteraction.data.russianroulette[message.channel.id].prize}**` : `!`)
        });

        let joinButton = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId(`russianRoulette-join`)
                .setLabel(`Join`)
                .setStyle(`SUCCESS`));
        let cancelButton = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId(`russianRoulette-cancel`)
                .setLabel(`Cancel`)
                .setStyle(`DANGER`)
                .setDisabled(true));
        let stopButton = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId(`russianRoulette-stop`)
                .setLabel(`Stop`)
                .setStyle(`DANGER`)
                .setDisabled(true));
        let aliveButton = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId(`russianRoulette-alive`)
                .setLabel(`Am I Alive ?`)
                .setStyle(`SECONDARY`));

        message.reply({
            embeds: [embed],
            components: [joinButton, cancelButton],
            failIfNotExists: false
        }, false).then(async msg => {
            message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });
            if (guild.waitingForInteraction.data.russianroulette[message.channel.id].startTimer >= 150000) {
                guild.waitingForInteraction.data.russianroulette[message.channel.id].pinnedMessage = msg;
                msg.pin().catch(e => utils.catchCustomLog(message, guild, e, `Could not pin message.`));
            }

            function start() {
                if (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "joining") {
                    embed.description = `**Click** on the **join button** below to join the **Russian Roulette** %prize%\nCurrent players [%player_amount%]: %player_list%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.join(', '))
                        .replaceAll(`%prize%`, (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prize != "undefined") ? `and try to win : **${guild.waitingForInteraction.data.russianroulette[message.channel.id].prize}**` : `!`)
                    msg.edit({
                        embeds: [embed],
                        components: (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "joining") ? [joinButton, cancelButton] : (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "pre-play") ? [joinButton, stopButton] : (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "playing") ? [aliveButton, stopButton] : []
                    })
                }
                if (!["joining", "pre-play"].includes(guild.waitingForInteraction.data.russianroulette[message.channel.id].status)) return;
                guild.waitingForInteraction.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => start(), 1000));
            }

            function round() {
                if (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "playing") {
                    let control = 5;
                    let eliminationMessage = undefined;
                    let playerSelect = guild.waitingForInteraction.data.russianroulette[message.channel.id].intervals.push(setInterval(async () => {
                        if (guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length <= guild.waitingForInteraction.data.russianroulette[message.channel.id].winners) {
                            let multipleWinners = (guild.waitingForInteraction.data.russianroulette[message.channel.id].winners == 1);
                            let winningEmbed = new MessageEmbed({
                                title: (multipleWinners) ? `We got our winner !` : `We got our winners !`,
                                color: guild.configurationManager.configuration.colors.main,
                                description: (multipleWinners) ?
                                    `%player_alive_list% is the only survivor, GG!%prize%`
                                    .replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                                    .replaceAll(`%prize%`, (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prize != "undefined") ? `\nThey won : **${guild.waitingForInteraction.data.russianroulette[message.channel.id].prize}**` : ``) : `%player_alive_list% are the only survivors, GGs!`
                                    .replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                                    .replaceAll(`%prize%`, (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prize != "undefined") ? `\nThey won : **${guild.waitingForInteraction.data.russianroulette[message.channel.id].prize}**` : ``)
                            });
                            message.channel.send({
                                embeds: [winningEmbed],
                                failIfNotExists: false
                            }, false).catch(e => {
                                MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            });
                            embed.description = `The **Russian Roulette** is done !\nTotal players **%player_amount%**\nWinner(s) [%player_alive_amount%]: %player_alive_list%\nDead players [%dead_player_amount%]: %dead_player_list%%prize%`
                                .replaceAll(`%player_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].players.length}`)
                                .replaceAll(`%player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].players.join(', '))
                                .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length}`)
                                .replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                                .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.length}`)
                                .replaceAll(`%dead_player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.join(', '))
                                .replaceAll(`%prize%`, (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prize != "undefined") ? `\nPrize : **${guild.waitingForInteraction.data.russianroulette[message.channel.id].prize}**` : ``);
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].status = "finished";
                            if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prizeObject != "undefined") {
                                if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prizeObject.run == "function") {
                                    guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.forEach(u => {
                                        guild.waitingForInteraction.data.russianroulette[message.channel.id].prizeObject.run(u);
                                    });
                                }
                            }
                            clearInterval(guild.waitingForInteraction.data.russianroulette[message.channel.id].intervals[playerSelect - 1]);
                            round();
                            return true;
                        }
                        let youDead = guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers[rn({
                            min: 0,
                            max: guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length - 1,
                            integer: true
                        })];
                        if (control > 0 && !guild.waitingForInteraction.data.russianroulette[message.channel.id].cannotDie.includes(youDead.id)) control--;
                        if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].sike != "undefined")
                            if (control > 0 && guild.waitingForInteraction.data.russianroulette[message.channel.id].sike == youDead.id && guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length != 2) control--;
                        if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].sike != "undefined")
                            if (control > 0 && guild.waitingForInteraction.data.russianroulette[message.channel.id].sike == youDead.id && guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length == 2) control--;
                        if (control <= 0) {
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers = guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.filter(function (value, index, arr) {
                                return value != youDead;
                            });
                            guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.push(youDead);
                            clearInterval(guild.waitingForInteraction.data.russianroulette[message.channel.id].intervals[playerSelect - 1]);
                        }
                        let eliminatedEmbed = new MessageEmbed({
                            title: (control > 0) ? `Rolling the barrel for.. ${youDead.username}#${youDead.discriminator}` : `${youDead.username}#${youDead.discriminator} :gun:`,
                            color: guild.configurationManager.configuration.colors.main,
                            description: (control > 0) ? `Players still alive : **%player_alive_amount%**`.replaceAll(`%player_alive_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length}`).replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', ')) : `${youDead} eliminated.\n${`Players still alive : **%player_alive_amount%**`.replaceAll(`%player_alive_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length}`).replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', '))}`
                        });
                        if (typeof eliminationMessage == "undefined") eliminationMessage = await message.channel.send({
                            embeds: [eliminatedEmbed],
                            components: [aliveButton],
                            failIfNotExists: false
                        }, false).catch(e => {
                            MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        });
                        if (typeof eliminationMessage != "undefined") eliminationMessage.edit({
                            embeds: [eliminatedEmbed],
                            failIfNotExists: false
                        }, false).catch(e => {
                            MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        });
                    }, ((guild.waitingForInteraction.data.russianroulette[message.channel.id].roundTimer - 3500) / 4)));
                    embed.description = `The **Russian Roulette** is running !\nTotal players **%player_amount%**\nPlayers alive [%player_alive_amount%]: %player_alive_list%\nDead players [%dead_player_amount%]: %dead_player_list%%prize%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].deadPlayers.join(', '))
                        .replaceAll(`%prize%`, (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].prize != "undefined") ? `\nPrize : **${guild.waitingForInteraction.data.russianroulette[message.channel.id].prize}**` : ``);
                    msg.edit({
                        embeds: [embed],
                        components: (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "joining") ? [joinButton, cancelButton] : (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "pre-play") ? [joinButton, stopButton] : (guild.waitingForInteraction.data.russianroulette[message.channel.id].status == "playing") ? [aliveButton, stopButton] : []
                    }).then(() => {
                        guild.waitingForInteraction.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => {
                            let roundRestartInterval = setInterval(() => {
                                if (control <= 0) {
                                    round();
                                    clearInterval(roundRestartInterval)
                                }
                            }, 1000);
                        }, guild.waitingForInteraction.data.russianroulette[message.channel.id].roundTimer));
                    }).catch(e => {
                        msg.channel.send(`POV: I couldnt edit the previous message`);
                    });
                }
                if (["finished", "cancelled"].includes(guild.waitingForInteraction.data.russianroulette[message.channel.id].status)) return clearPending(guild, message);
            }

            start();

            guild.waitingForInteraction.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => {
                guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers = Object.assign([], guild.waitingForInteraction.data.russianroulette[message.channel.id].players);
                guild.waitingForInteraction.data.russianroulette[message.channel.id].status = "pre-play";
                let prestartingEmbed = new MessageEmbed({
                    title: `The Russian Roulette is about to start !`,
                    color: guild.configurationManager.configuration.colors.main
                });
                message.channel.send({
                    embeds: [prestartingEmbed],
                    failIfNotExists: false
                }, false).catch(e => {
                    MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
            }, guild.waitingForInteraction.data.russianroulette[message.channel.id].startTimer - 5000));


            let startingTimeout = guild.waitingForInteraction.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => {
                if (guild.waitingForInteraction.data.russianroulette[message.channel.id].players.length < 2) {
                    guild.waitingForInteraction.data.russianroulette[message.channel.id].status = "cancelled";
                    let winningEmbed = new MessageEmbed({
                        title: `Russian Roulette Cancelled`,
                        color: guild.configurationManager.configuration.colors.main,
                        description: `No one wants to play my game :(`
                    });
                    message.channel.send({
                        embeds: [winningEmbed],
                        failIfNotExists: false
                    }, false).catch(e => {
                        MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                    clearPending(guild, message);
                    return true;
                }
                guild.waitingForInteraction.data.russianroulette[message.channel.id].status = "playing";
                round();
                let startingEmbed = new MessageEmbed({
                    title: `The Russian Roulette started`,
                    color: guild.configurationManager.configuration.colors.main,
                    description: `Good luck %player_list% !`
                        .replaceAll(`%player_amount%`, `0`)
                        .replaceAll(`%player_list%`, guild.waitingForInteraction.data.russianroulette[message.channel.id].players.join(', '))
                });
                message.channel.send({
                    embeds: [startingEmbed],
                    failIfNotExists: false
                }, false).catch(e => {
                    MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
            }, guild.waitingForInteraction.data.russianroulette[message.channel.id].startTimer));

            if (typeof guild.waitingForInteraction.channels[message.channel.id] == "undefined") guild.waitingForInteraction.channels[message.channel.id] = {};
            guild.waitingForInteraction.channels[message.channel.id]['russianRoulette-join'] = async (interaction) => {
                if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id] == "undefined") return await interaction.reply({
                    content: 'No Russian Roulette hapenning currently',
                    ephemeral: true,
                }).catch(e => {});
                if (!["joining", "pre-play"].includes(guild.waitingForInteraction.data.russianroulette[message.channel.id].status)) return await interaction.reply({
                    content: 'Russian Roulette is not playing currently.',
                    ephemeral: true,
                }).catch(e => {});
                if (guild.waitingForInteraction.data.russianroulette[message.channel.id].players.includes(interaction.user)) return await interaction.reply({
                    content: 'You\'ve already joined.',
                    ephemeral: true,
                }).catch(e => {});
                guild.waitingForInteraction.data.russianroulette[message.channel.id].players.push(interaction.user);
                return await interaction.reply({
                    content: 'You joined the Russian Roulette',
                    ephemeral: true,
                }).catch(e => {});
            }
            guild.waitingForInteraction.channels[message.channel.id]['russianRoulette-cancel'] = async (interaction) => {
                if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id] == "undefined") return await interaction.reply({
                    content: 'No Russian Roulette hapenning currently',
                    ephemeral: true,
                }).catch(e => {});
                if (!["joining", "pre-play"].includes(guild.waitingForInteraction.data.russianroulette[message.channel.id].status)) return await interaction.reply({
                    content: 'No Russian Roulette hapenning currently',
                    ephemeral: true,
                }).catch(e => {});
                guild.waitingForInteraction.data.russianroulette[message.channel.id].status = "cancelled";
                utils.sendSuccess(message, guild, `Russian Roulette cancelled.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
                clearTimeout(startingTimeout);
                return await interaction.reply({
                    content: 'You cancelled the Russian Roulette',
                    ephemeral: true,
                }).catch(e => {});
            }
            guild.waitingForInteraction.channels[message.channel.id]['russianRoulette-stop'] = async (interaction) => {
                if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id] == "undefined") return await interaction.reply({
                    content: 'No Russian Roulette hapenning currently',
                    ephemeral: true,
                }).catch(e => {});
                if (!["playing"].includes(guild.waitingForInteraction.data.russianroulette[message.channel.id].status)) return await interaction.reply({
                    content: 'Russian Roulette is not playing currently.',
                    ephemeral: true,
                }).catch(e => {});
                guild.waitingForInteraction.data.russianroulette[message.channel.id].status = "cancelled";
                utils.sendSuccess(message, guild, `Russian Roulette stopped.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
                clearTimeout(startingTimeout);
                return await interaction.reply({
                    content: 'You stopped the Russian Roulette',
                    ephemeral: true,
                }).catch(e => {});
            }
            guild.waitingForInteraction.channels[message.channel.id]['russianRoulette-alive'] = async (interaction) => {
                if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id] == "undefined") return await interaction.reply({
                    content: 'No Russian Roulette hapenning currently',
                    ephemeral: true,
                }).catch(e => {});
                if (!["playing"].includes(guild.waitingForInteraction.data.russianroulette[message.channel.id].status)) return await interaction.reply({
                    content: 'Russian Roulette is not playing currently.',
                    ephemeral: true,
                }).catch(e => {});
                return await interaction.reply({
                    content: guild.waitingForInteraction.data.russianroulette[message.channel.id].players.includes(interaction.user) ? guild.waitingForInteraction.data.russianroulette[message.channel.id].alivePlayers.includes(interaction.user) ? `You are still alive!` : `You lost` : `You are not playing this game`,
                    ephemeral: true,
                }).catch(e => {});
            }
        }).catch(e => {
            MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
        });
        return true;
    }
}

function clearPending(guild, message) {
    guild.waitingForInteraction.data.russianroulette[message.channel.id].intervals.forEach(interval => clearInterval(interval));
    guild.waitingForInteraction.data.russianroulette[message.channel.id].timeouts.forEach(interval => clearTimeout(interval));
    if (typeof guild.waitingForInteraction.data.russianroulette[message.channel.id].pinnedMessage != "undefined") guild.waitingForInteraction.data.russianroulette[message.channel.id].pinnedMessage.unpin().catch(e => utils.catchCustomLog(message, guild, e, `Could not unpin message.`));
    delete guild.waitingForInteraction.data.russianroulette[message.channel.id];
}