var rn = require("random-number");
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require(`discord.js`);
const utils = require(`../utils`);
const {
    configuration,
    MainLog
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
        makeprize: "commands.russianroulette.settings",
        stop: "commands.russianroulette.stop",
        cancel: "commands.russianroulette.cancel",
        join: "commands.russianroulette.join"
    },
    async exec(client, message, args, guild = undefined) {
        if (typeof guild.waitingForInteration.data.russianroulette[message.channel.id] != "undefined") return utils.sendError(message, guild, `A Russian Roulette is already running.`);

        guild.waitingForInteration.data.russianroulette[message.channel.id] = {
            players: [],
            playersDisplay: [],
            alivePlayers: [],
            deadPlayers: [],
            prize: null,
            winners: 1,
            status: "joining",
            startTimer: 10000,
            roundTimer: 4000,
            intervals: [],
            timeouts: []
        };

        let embed = new MessageEmbed({
            title: `The Russian Roulette will start in ${guild.waitingForInteration.data.russianroulette[message.channel.id].startTimer/1000} seconds`,
            color: guild.configuration.colors.main,
            description: `**Click** on the **join button** below to join the **Russian Roulette** !\nCurrent players [%player_amount%]: %player_list%`.replaceAll(`%player_amount%`, `0`).replaceAll(`%player_list%`, ``)
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
                .setStyle(`DANGER`));
        let stopButton = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId(`russianRoulette-stop`)
                .setLabel(`Stop`)
                .setStyle(`DANGER`));

        message.reply({
            embeds: [embed],
            components: [joinButton, cancelButton],
            failIfNotExists: false
        }, false).then(async msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });

            guild.waitingForInteration.data.russianroulette[message.channel.id].intervals.push(setInterval(() => {
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "joining") {
                    embed.description = `**Click** on the **join button** below to join the **Russian Roulette** !\nCurrent players [%player_amount%]: %player_list%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.join(', '));
                }
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "playing") {
                    let control = 3;
                    let eliminationMessage = undefined;
                    let playerSelect = guild.waitingForInteration.data.russianroulette[message.channel.id].intervals.push(setInterval(async () => {
                        if (guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length <= guild.waitingForInteration.data.russianroulette[message.channel.id].winners) {
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
                        let eliminatedEmbed = new MessageEmbed({
                            title: (control > 0) ? `Rolling the barrel for.. ${youDead.username}#${youDead.discriminator}` : `${youDead.username}#${youDead.discriminator} :gun:`,
                            color: guild.configuration.colors.main,
                            description: (control > 0) ? `Players left [%player_alive_amount%]: %player_alive_list%`.replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`).replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', ')) : `${youDead} eliminated.\n${`Players left [%player_alive_amount%]: %player_alive_list%`.replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`).replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))}`
                        });
                        if (typeof eliminationMessage == "undefined") eliminationMessage = await message.channel.send({
                            embeds: [eliminatedEmbed],
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
                        if (control <= 0) {
                            guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers = guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.filter(function (value, index, arr) {
                                return value != youDead;
                            });
                            guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.push(youDead);
                            clearInterval(guild.waitingForInteration.data.russianroulette[message.channel.id].intervals[playerSelect - 1]);
                        }
                    }, guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer / 3));
                    embed.description = `The **Russian Roulette** is running !\nTotal players **%player_amount%**\nPlayers alive [%player_alive_amount%]: %player_alive_list%\nDead players [%dead_player_amount%]: %dead_player_list%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.join(', '));
                }
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "finished") {
                    let multipleWinners = (guild.waitingForInteration.data.russianroulette[message.channel.id].winners == 1);
                    let winningEmbed = new MessageEmbed({
                        title: (multipleWinners) ? `We got our winner !` : `We got our winners !`,
                        color: guild.configuration.colors.main,
                        description: (multipleWinners) ?
                            `%player_alive_list% is the only survivor, GG!`
                            .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', ')) : `%player_alive_list% are the only survivors, GGs!`
                            .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                    });
                    message.channel.send({
                        embeds: [winningEmbed],
                        failIfNotExists: false
                    }, false).catch(e => {
                        MainLog.log(`Could not send message in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                    embed.description = `The **Russian Roulette** is done !\nTotal players **%player_amount%**\nWinner(s) [%player_alive_amount%]: %player_alive_list%\nDead players [%dead_player_amount%]: %dead_player_list%`
                        .replaceAll(`%player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].players.length}`)
                        .replaceAll(`%player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].players.join(', '))
                        .replaceAll(`%player_alive_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.length}`)
                        .replaceAll(`%player_alive_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers.join(', '))
                        .replaceAll(`%dead_player_amount%`, `${guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.length}`)
                        .replaceAll(`%dead_player_list%`, guild.waitingForInteration.data.russianroulette[message.channel.id].deadPlayers.join(', '));
                }
                msg.edit({
                    embeds: [embed]
                })
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "finished") clearPending(guild, message);
            }, guild.waitingForInteration.data.russianroulette[message.channel.id].roundTimer));


            guild.waitingForInteration.data.russianroulette[message.channel.id].timeouts.push(setTimeout(() => {
                guild.waitingForInteration.data.russianroulette[message.channel.id].alivePlayers = Object.assign([], guild.waitingForInteration.data.russianroulette[message.channel.id].players);
                guild.waitingForInteration.data.russianroulette[message.channel.id].status = "playing";
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
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].status == "playing") return;
                if (guild.waitingForInteration.data.russianroulette[message.channel.id].players.includes(interation.user)) return;
                guild.waitingForInteration.data.russianroulette[message.channel.id].players.push(interation.user);

                interation.reply({
                    content: 'You joined the Russian Roulette',
                    ephemeral: true,
                })
                return true;
            }
            guild.waitingForInteration.channels[message.channel.id]['russianRoulette-cancel'] = (interation) => {
                return true;
            }
            guild.waitingForInteration.channels[message.channel.id]['russianRoulette-stop'] = (interation) => {
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