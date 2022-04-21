var rn = require("random-number");
const {
    MessageEmbed
} = require(`discord.js`);
const utils = require(`../utils`);
const {
    globalConfiguration,
    MainLog
} = require(`../../index`);

module.exports = {
    name: "rockpaperscissors",
    description: `Rock paper scissors`,
    aliases: ["rps"],
    permission: `commands.rockpaperscissors`,
    category: `fun`,
    async exec(client, message, args, guild = undefined) {
        let possibilities = ["rock", "paper", "scissors"];
        if (typeof guild.waitingForMessage.data.rockpaperscissors[message.author.id] == "undefined") guild.waitingForMessage.data.rockpaperscissors[message.author.id] = {
            gonnaPlay: possibilities[rn({
                min: 0,
                max: possibilities.length - 1,
                integer: true
            })],
            rounds: 3,
            results: []
        };

        let embed = new MessageEmbed({
            title: `I choose what im gonna send, ur turn :eyes:`,
            color: guild.configurationManager.configuration.colors.main,
            description: `Possibilities are (case sensitive) : \`rock\`, \`paper\`, \`scissors\` [${guild.waitingForMessage.data.rockpaperscissors[message.author.id].rounds} rounds]`
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(async msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });


            /* Creating the handler for future messages in the channel */
            if (typeof guild.waitingForMessage.channels == "undefined") guild.waitingForMessage.channels = [];
            if (typeof guild.waitingForMessage.channels[message.channel.id] == "undefined") guild.waitingForMessage.channels[message.channel.id] = [];
            guild.waitingForMessage.channels[message.channel.id][message.author.id] = (message) => {
                let possibilities = ["rock", "paper", "scissors"];
                if (!possibilities.includes(message.content)) return utils.sendError(message, guild, `Wrong play.`, `Possibilities are (case sensitive) : \`rock\`, \`paper\`, \`scissors\``, [], true); /*Updated To New Utils*/
                if (message.content.startsWith(globalConfiguration.globalConfiguration.configuration.globalPrefix) || message.content.startsWith(guild.configurationManager.configuration.prefix)) return false;
                guild.waitingForMessage.data.rockpaperscissors[message.author.id].gonnaPlay = possibilities[rn({
                    min: 0,
                    max: possibilities.length - 1,
                    integer: true
                })];
                let playerPlayed = message.content;
                let botPlayed = guild.waitingForMessage.data.rockpaperscissors[message.author.id].gonnaPlay;
                message.channel.send(botPlayed);

                if (playerPlayed.toLowerCase() == "rock") {
                    if (botPlayed == "rock") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: null,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                    if (botPlayed == "paper") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: true,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                    if (botPlayed == "scissors") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: false,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                }
                if (playerPlayed.toLowerCase() == "paper") {
                    if (botPlayed == "rock") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: false,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                    if (botPlayed == "paper") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: null,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                    if (botPlayed == "scissors") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: true,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                }
                if (playerPlayed.toLowerCase() == "scissors") {
                    if (botPlayed == "rock") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: true,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                    if (botPlayed == "paper") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: false,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                    if (botPlayed == "scissors") guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.unshift({
                        wins: null,
                        player: playerPlayed,
                        bot: botPlayed
                    });
                }

                if (guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.length == guild.waitingForMessage.data.rockpaperscissors[message.author.id].rounds) {
                    let wins = {
                        bot: 0,
                        player: 0
                    };
                    let round = guild.waitingForMessage.data.rockpaperscissors[message.author.id].rounds;
                    let embedFields = [];
                    guild.waitingForMessage.data.rockpaperscissors[message.author.id].results.forEach(result => {
                        if (result.wins == true) {
                            wins.bot++;
                        } else if (result.wins == false) {
                            wins.player++;
                        }
                        round--;
                        embedFields.push([`Round ${round}`, `I played **${result.bot}**\nYou played **${result.player}**\nWinner: ${(result.wins == true) ? `**Me**` : (result.wins == false) ? `**You**` : `**None**`}`, false])
                    });
                    utils.sendMain(message, guild, `${(wins.bot == wins.player) ? `Its a draw` : (wins.bot > wins.player) ? `I won` : `You won` }`, undefined, embedFields, true); /*Updated To New Utils*/
                    clearPending(guild, message);
                    return true;
                } else {
                    utils.sendMain(message, guild, `${(guild.waitingForMessage.data.rockpaperscissors[message.author.id].results[0].wins == null) ? `Its a draw, lets continue` : (guild.waitingForMessage.data.rockpaperscissors[message.author.id].results[0].wins == true) ? `I won, lets continue` : `You won, lets continue` }`, undefined, [], true); /*Updated To New Utils*/
                    return true;
                }
            }
        }).catch(e => {
            MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
        });
        return true;
    }
}

function clearPending(guild, message) {
    if (typeof guild.waitingForMessage.channels[message.channel.id] != "undefined")
        if (typeof guild.waitingForMessage.channels[message.channel.id][message.author.id] != "undefined")
            delete guild.waitingForMessage.channels[message.channel.id][message.author.id];
    delete guild.waitingForMessage.data.rockpaperscissors[message.author.id];
}