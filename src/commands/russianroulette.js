var rn = require("random-number");
const timestring = require('timestring')
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require(`discord.js`);
const utils = require(`../utils`);
const {
    configuration,
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
        join: "commands.russianroulette.join"
    },
    async exec(client, message, args, guild = undefined) {
        if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id] != "undefined") return utils.sendError(message, guild, `A Russian Roulette is already running.`);

        const premadePrizes = {
            muted1min: {
                name: "Muted One Minute",
                key: "muted1min",
                run: async (user) => {
                    message.channel.send(`Enjoy your 1 minute mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `Won the Russian Roulette`, 1 * 60);
                }
            },
            muted5min: {
                name: "Muted Five Minutes",
                key: "muted5min",
                run: async (user) => {
                    message.channel.send(`Enjoy your 5 minutes mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `Won the Russian Roulette`, 5 * 60);
                }
            },
            muted10min: {
                name: "Muted Ten Minutes",
                key: "muted10min",
                run: async (user) => {
                    message.channel.send(`Enjoy your 10 minutes mute <@${user.id}> :smiling_face_with_3_hearts:`);
                    return await guild.muteUser(message, user.id, `Won the Russian Roulette`, 10 * 60);
                }
            }
        }

        guild.waitingForInteration.data.russianroulette[message.channel.id] = {
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
            timeouts: []
        };

        let customPermission = this.nestedPermissions.custom;
        let hasCustomPermissionGlobalPermission = await globalPermissions.userHasPermission(customPermission, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let hasCustomPermission = (hasCustomPermissionGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(customPermission, message.author.id, undefined, message.channel.id, message.guild.id) : hasCustomPermissionGlobalPermission;

        if (hasCustomPermission) {
            args.forEach(async invividualArgument => {
                if (invividualArgument.toLowerCase().startsWith("-starttimer:")) {
                    try {
                        let time = parseInt(invividualArgument.replace('-starttimer:', ``));
                        guild.waitingForInteration.data.russianroulette[message.channel.id].startTimer = time * 1000;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-roundtimer:")) {
                    try {
                        let time = timestring(invividualArgument.replace('-roundtimer:', ``));
                        guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer = (time > guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer) ? time : guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-winners:")) {
                    try {
                        let amount = parseInt(invividualArgument.replace('-winners:', ``));
                        guild.waitingForInteration.data.russianroulette[message.channel.id].winners = amount;
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
                if (invividualArgument.toLowerCase().startsWith("-prize:")) {
                    try {
                        let prize = invividualArgument.replace('-prize:', ``);
                        if (typeof premadePrizes[prize] != "undefined") {
                            guild.waitingForInteration.data.russianroulette[message.channel.id].prize = premadePrizes[prize].name;
                            guild.waitingForInteration.data.russianroulette[message.channel.id].prizeObject = premadePrizes[prize];
                        } else {
                            guild.waitingForInteration.data.russianroulette[message.channel.id].prize = prize.replace('_', ' ');
                        }
                        args = args.filter(arrayItem => arrayItem !== invividualArgument);
                    } catch (e) {}
                }
            });
        }

        let embed = new MessageEmbed({
            title: `The Russian Roulette will start in ${guild.waitingForInteration.data.russianroulette[message.channel.id].startTimer/1000} seconds`,
            color: guild.configuration.colors.main,
            description: `**Click** on the **join button** below to join the **Russian Roulette** %prize%\nCurrent players [%player_amount%]: %player_list%`
                .replaceAll(`%player_amount%`, `0`)
                .replaceAll(`%player_list%`, ``)
                .replaceAll(`%prize%`, (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prize != "undefined") ? `and try to win : **${guild.waitingForInteration.data.russianroulette[message.channel.id].prize}**` : `!`)
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
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });

            function start() {
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "joining") {
                    embed.description = `**Click** on the **join button** below to join the **Russian Roulette** %prize%\nCurrent players [%player_amount%]: %player_list%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.join(', '))
                        .replaceAll(`%prize%`, (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prize != "undefined") ? `and try to win : **${guild.waitingForInteration.data.russianroulette[message.channel.id].prize}**` : `!`)
                    msg.edit({
                        embeds: [embed],
                        components: (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "joining") ? [joinButton, cancelButton] : (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "pre-play") ? [joinButton, stopButton] : (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "playing") ? [aliveButton, stopButton] : []
                    })
                }
                if (!["joining", "pre-play"].includes(guild.waitingForInteration.data.russianroulette[message.channel.id].status)) return;
                guild.waitingForInteration.data.russianroulette[message.channel.id].timeouts.push(setTimeout(()=>start(), 1000));
            }

            function round() {
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "playing") {
                    let control = 5;
                    let eliminationMessage = undefined;
                    let playerSelect = guild.waitingForInteration.data.russianroulette[message.channel.id].intervals.push(setInterval(async () => {
                        if (guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length <= guild.waitingForInteration.data.russianroulette[message.channel.id].winners) {
                            let multipleWinners = (guild.waitingForInteration.data.russianroulette[message.channel.id].winners == 1);
                            let winningEmbed = new MessageEmbed({
                                title: (multipleWinners) ? `We got our winner !` : `We got our winners !`,
                                color: guild.configuration.colors.main,
                                description: (multipleWinners) ?
                                    `%player_alive_list% is the only survivor, GG!%prize%`
                                    .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                                    .replaceAll(`%prize%`, (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prize != "undefined") ? `\nThey won : **${guild.waitingForInteration.data.russianroulette[message.channel.id].prize}**` : ``) : `%player_alive_list% are the only survivors, GGs!`
                                    .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                                    .replaceAll(`%prize%`, (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prize != "undefined") ? `\nThey won : **${guild.waitingForInteration.data.russianroulette[message.channel.id].prize}**` : ``)
                            });
                            message.channel.send({
                                embeds: [winningEmbed],
                                failIfNotExists: false
                            }, false).catch(e => {
                                MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            });
                            if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prizeObject != "undefined") {
                                if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prizeObject.run == "function") {
                                    guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.forEach(u => {
                                        guild.waitingForInteration.data.russianroulette[message.channel.id].prizeObject.run(u);
                                    });
                                }
                            }
                            embed.description = `The **Russian Roulette** is done !\nTotal players **%player_amount%**\nWinner(s) [%player_alive_amount%]: %player_alive_list%\nDead players [%dead_player_amount%]: %dead_player_list%%prize%`
                                .replaceAll(`%player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].players.length}`)
                                .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                                .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`)
                                .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                                .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.length}`)
                                .replaceAll(`%dead_player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.join(', '))
                                .replaceAll(`%prize%`, (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prize != "undefined") ? `\nPrize : **${guild.waitingForInteration.data.russianroulette[message.channel.id].prize}**` : ``);
                            guild.waitingForInteration.data.russianroulette[message.channel.id].status = "finished";
                            clearInterval(guild.waitingForInteration.data.russianroulette[message.channel.id].intervals[playerSelect - 1]);
                            return true;
                        }
                        control--;
                        let youDead = guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers[rn({
                            min: 0,
                            max: guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length - 1,
                            integer: true
                        })];
                        if (control <= 0) {
                            guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers = guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.filter(function (value, index, arr) {
                                return value != youDead;
                            });
                            guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.push(youDead);
                            clearInterval(guild.waitingForInteration.data.russianroulette[message.channel.id].intervals[playerSelect - 1]);
                        }
                        let eliminatedEmbed = new MessageEmbed({
                            title: (control > 0) ? `Rolling the barrel for.. ${youDead.username}#${youDead.discriminator}` : `${youDead.username}#${youDead.discriminator} :gun:`,
                            color: guild.configuration.colors.main,
                            description: (control > 0) ? `Players still alive : **%player_alive_amount%**`.replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`).replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', ')) : `${youDead} eliminated.\n${`Players still alive : **%player_alive_amount%**`.replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`).replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))}`
                        });
                        if (typeof eliminationMessage == "undefined") eliminationMessage = await message.channel.send({
                            embeds: [eliminatedEmbed],
                            components: [aliveButton],
                            failIfNotExists: false
                        }, false).catch(e => {
                            MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        });
                        if (typeof eliminationMessage != "undefined") eliminationMessage.edit({
                            embeds: [eliminatedEmbed],
                            failIfNotExists: false
                        }, false).catch(e => {
                            MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        });
                    }, ((guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer - 3500) / 4)));
                    embed.description = `The **Russian Roulette** is running !\nTotal players **%player_amount%**\nPlayers alive [%player_alive_amount%]: %player_alive_list%\nDead players [%dead_player_amount%]: %dead_player_list%%prize%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.join(', '))
                        .replaceAll(`%prize%`, (typeof guild.waitingForInteration.data.russianroulette[message.channel.id].prize != "undefined") ? `\nPrize : **${guild.waitingForInteration.data.russianroulette[message.channel.id].prize}**` : ``);
                    msg.edit({
                        embeds: [embed],
                        components: (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "joining") ? [joinButton, cancelButton] : (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "pre-play") ? [joinButton, stopButton] : (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "playing") ? [aliveButton, stopButton] : []
                    })
                }
                if (["finished", "cancelled"].includes(guild.waitingForInteration.data.russianroulette[message.channel.id].status)) return clearPending(guild, message);
                guild.waitingForInteration.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => round(),guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer));
            }

            start();

            guild.waitingForInteration.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => {
                guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers = Object.assign([], guild.waitingForInteration.data.russianroulette[message.channel.id].players);
                guild.waitingForInteration.data.russianroulette[message.channel.id].status = "pre-play";
                let prestartingEmbed = new MessageEmbed({
                    title: `The Russian Roulette is about to start !`,
                    color: guild.configuration.colors.main
                });
                message.channel.send({
                    embeds: [prestartingEmbed],
                    failIfNotExists: false
                }, false).catch(e => {
                    MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
            }, guild.waitingForInteration.data.russianroulette[message.channel.id].startTimer - 5000));


            guild.waitingForInteration.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => {
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].players.length < 2) {
                    guild.waitingForInteration.data.russianroulette[message.channel.id].status = "cancelled";
                    let winningEmbed = new MessageEmbed({
                        title: `Russian Roulette Cancelled`,
                        color: guild.configuration.colors.main,
                        description: `No one wants to play my game :(`
                    });
                    message.channel.send({
                        embeds: [winningEmbed],
                        failIfNotExists: false
                    }, false).catch(e => {
                        MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                    clearPending(guild, message);
                    return true;
                }
                guild.waitingForInteration.data.russianroulette[message.channel.id].status = "playing";
                round();
                let startingEmbed = new MessageEmbed({
                    title: `The Russian Roulette started`,
                    color: guild.configuration.colors.main,
                    description: `Good luck %player_list% !`
                        .replaceAll(`%player_amount%`, `0`)
                        .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                });
                message.channel.send({
                    embeds: [startingEmbed],
                    failIfNotExists: false
                }, false).catch(e => {
                    MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
            }, guild.waitingForInteration.data.russianroulette[message.channel.id].startTimer));

            if (typeof guild.waitingForInteration.channels[message.channel.id] == "undefined") guild.waitingForInteration.channels[message.channel.id] = {};
            guild.waitingForInteration.channels[message.channel.id]['russianRoulette-join'] = (interation) => {
                if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id] == "undefined") return;
                if (!["joining", "pre-play"].includes(guild.waitingForInteration.data.russianroulette[message.channel.id].status)) return;
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].players.includes(interation.user)) return;
                guild.waitingForInteration.data.russianroulette[message.channel.id].players.push(interation.user);

                interation.reply({
                    content: 'You joined the Russian Roulette',
                    ephemeral: true,
                })
                return true;
            }
            guild.waitingForInteration.channels[message.channel.id]['russianRoulette-cancel'] = (interation) => {
                if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id] == "undefined") return;
                if (!["joining", "pre-play"].includes(guild.waitingForInteration.data.russianroulette[message.channel.id].status)) return false;
                return true;
            }
            guild.waitingForInteration.channels[message.channel.id]['russianRoulette-stop'] = (interation) => {
                if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id] == "undefined") return;
                if (!["playing"].includes(guild.waitingForInteration.data.russianroulette[message.channel.id].status)) return false;
                return true;
            }
            guild.waitingForInteration.channels[message.channel.id]['russianRoulette-alive'] = (interation) => {
                if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id] == "undefined") return;
                if (!["playing"].includes(guild.waitingForInteration.data.russianroulette[message.channel.id].status)) return false;
                interation.reply({
                    content: guild.waitingForInteration.data.russianroulette[message.channel.id].players.includes(interation.user) ? guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.includes(interation.user) ? `You are still alive!` : `You lost` : `You are not playing this game`,
                    ephemeral: true,
                })
                return true;
            }
        }).catch(e => {
            MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
        });
        return true;
    }
}

function clearPending(guild, message) {
    guild.waitingForInteration.data.russianroulette[message.channel.id].intervals.forEach(interval => clearInterval(interval));
    guild.waitingForInteration.data.russianroulette[message.channel.id].timeouts.forEach(interval => clearTimeout(interval));
    delete guild.waitingForInteration.data.russianroulette[message.channel.id];
}