const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    configuration,
    packageJson,
    MainLog
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "makeembed",
    description: `A tool to create embeds.`,
    aliases: ["embedgen", "genembed", "embed"],
    permission: `commands.makeembed`,
    category: `tools`,
    async exec(client, message, args, guild = undefined) {
        let OGMessage = message;
        let embed = new MessageEmbed({
            title: `${(args.length != 0 && args[0].toLowerCase() == "help") ? `Embed Creator Help` : `Initilizing the embed.. Use commands below to set it up !`}`,
            color: guild.configuration.colors.main,
            description: `You dont have to add the prefix if its not shown below. Make any of those 'none' to remove them.`
        });

        if (args.length != 0 && args[0].toLowerCase() == "help") embed.addField(`\`${guild.configuration.prefix}makeembed\``, `Start the embed creation utility`, false);
        embed.addField(`\`${guild.configuration.prefix}makeembed <help/hidehelp>\``, `Show this help without triggering the embed creation`, false);
        embed.addField(`\`setTitle <The embed title>\``, `Set the embed title `, false);
        embed.addField(`\`setDescription <The embed description>\``, `Set the embed description [Works with CodeBlocks & Tags] `, false);
        embed.addField(`\`setColor <The embed color>\``, `Set the embed color [Format: #FFFFFF]`, false);
        embed.addField(`\`addField <"Here the field title"> <"Here the field description"> [-inline]\``, `Add a field to the embed [Type the title and description betweed <"">, add -inline to make it.. inline]`, false);
        embed.addField(`\`editField <fieldID> <"Here the field title"> <"Here the field description"> [-inline]\``, `Edit a field of the embed [The id count starts from 0. Type the title and description betweed <"">, add -inline to make it.. inline]`, false);
        embed.addField(`\`removeField <fieldID>\``, `Remove a field from the embed [The id count starts from 0]`, false);
        embed.addField(`\`setAuthor <The embed author>\``, `Set the embed author`, false);
        embed.addField(`\`setAuthorUrl <The image url>\``, `Set the link for the title (Will allow to click on the author text to go on a certain url)`, false);
        embed.addField(`\`setFooter <The embed footer>\``, `Set the embed footer`, false);
        embed.addField(`\`setFooterImage <The footer image>\``, `Set the embed footer image `, false);
        embed.addField(`\`setUrl <The embed url>\``, `Set the link for the title (Will allow to click on the title to go on a certain url)`, false);
        embed.addField(`\`setImage <The image url>\``, `Set the main image of the embed`, false);
        embed.addField(`\`setThumbnail <The image url>\``, `Set the thumbnail of the embed (Displayed at the top right of it)`, false);
        embed.addField(`\`sendEmbed\``, `Send the embed (sends it in the channel you typed this command in)`, false);
        embed.addField(`\`cancel/leave/close\``, `Cancel the embed you were building`, false);
        embed.addField(`\`exportjson\``, `Export the json of your current embed.`, false);
        embed.addField(`\`loadjson{}\``, `Load a json, where \`{}\` is the json. (Only json exported from there will work, im stoopid and a made my own way of handling embed bcause i lost parts of my brain sorry :))))))))`, false);
        //embed.addField(`\`saveembed <name> [-public]\``, `Save your current embed to load it back later. (-public allows other users to load it) [Public embeds are guild scoped]`, false);
        //embed.addField(`\`loadembed <name> [-public]\``, `Load a saved embed. (-public to load a public embed) [Public embeds are guild scoped]`, false);
        //embed.addField(`\`listembeds [-public]\``, `List saved embeds. (-public lists publics embed) [Public embeds are guild scoped]`, false);

        if (args.length != 0 && args[0].toLowerCase() == "hidehelp") embed.fields = [];
        if (args.length != 0 && args[0].toLowerCase() == "hidehelp") embed.description = ``;
        if (args.length != 0 && args[0].toLowerCase() == "hidehelp") embed.title = `Embed creator started. Help hidden`;

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            });
            if (args.length != 0 && args[0].toLowerCase() == "help") return;

            if (typeof guild.waitingForMessage == "object") {
                if (typeof guild.waitingForMessage.data.makeembed != "object") guild.waitingForMessage.data.makeembed = {};
                if (typeof guild.waitingForMessage.data.makeembed[message.author.id] != "object") guild.waitingForMessage.data.makeembed[message.author.id] = {
                    creator: message.author.id,
                    title: ``,
                    description: ``,
                    fields: [],
                    color: guild.configuration.colors.main
                };

                guild.waitingForMessage.users[message.author.id] = async (message) => {
                    if (typeof guild.waitingForMessage.data.makeembed[message.author.id] != "object") {
                        delete guild.waitingForMessage.users[message.author.id];
                        return false;
                    }
                    let args = message.content.split(' ');
                    let cmd = args.shift(args);

                    if (cmd.toLowerCase() == "settitle") {
                        guild.waitingForMessage.data.makeembed[message.author.id].title = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "seturl") {
                        if (typeof args[0] == "undefined" || !args[0].startsWith('https://')) {
                            let embed = new MessageEmbed({
                                title: `Wrong link`,
                                color: guild.configuration.colors.error,
                                description: `Links must start with \`https://\``
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            delete guild.waitingForMessage.users[message.author.id];
                            return true;
                        }
                        guild.waitingForMessage.data.makeembed[message.author.id].url = args[0];
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setdescription") {
                        guild.waitingForMessage.data.makeembed[message.author.id].description = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setcolor") {
                        guild.waitingForMessage.data.makeembed[message.author.id].color = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "addfield") {
                        let embedField = ["", "", false]
                        if (args.includes('-inline')) {
                            embedField[2] = true;
                            args = args.filter(arrayItem => arrayItem !== `-inline`);
                        }
                        let extractData = args.join(' ').split(`<"`);
                        embedField[0] = extractData[1].slice(0, -3);
                        embedField[1] = extractData[2].slice(0, -2);
                        guild.waitingForMessage.data.makeembed[message.author.id].fields.push(embedField);
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "editfield") {
                        let fiedNumber = args.shift();
                        let embedField = ["", "", false]
                        if (args.includes('-inline')) {
                            embedField[2] = true;
                            args = args.filter(arrayItem => arrayItem !== `-inline`);
                        }
                        let extractData = args.join(' ').split(`<"`);
                        embedField[0] = extractData[1].slice(0, -3);
                        embedField[1] = extractData[2].slice(0, -2);
                        guild.waitingForMessage.data.makeembed[message.author.id].fields[fiedNumber] = embedField;
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "removefield") {
                        let fiedNumber = args.shift();
                        guild.waitingForMessage.data.makeembed[message.author.id].fields.splice(fiedNumber, 1);
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setauthor") {
                        guild.waitingForMessage.data.makeembed[message.author.id].author = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setauthorurl") {
                        guild.waitingForMessage.data.makeembed[message.author.id].authorurl = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setfooter") {
                        guild.waitingForMessage.data.makeembed[message.author.id].footer = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setfooterimage") {
                        guild.waitingForMessage.data.makeembed[message.author.id].footerimage = args.join(' ');
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (cmd.toLowerCase() == "setimage") {
                        if (typeof args[0] == "undefined" || !args[0].startsWith('https://')) {
                            let embed = new MessageEmbed({
                                title: `Wrong link`,
                                color: guild.configuration.colors.error,
                                description: `Links must start with \`https://\``
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            delete guild.waitingForMessage.users[message.author.id];
                            return true;
                        }
                        guild.waitingForMessage.data.makeembed[message.author.id].image = args[0];
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (["setthumbnail"].includes(cmd.toLowerCase())) {
                        if (typeof args[0] == "undefined" || !args[0].startsWith('https://')) {
                            let embed = new MessageEmbed({
                                title: `Wrong link`,
                                color: guild.configuration.colors.error,
                                description: `Links must start with \`https://\``
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            delete guild.waitingForMessage.users[message.author.id];
                            return true;
                        }
                        guild.waitingForMessage.data.makeembed[message.author.id].thumbnail = args[0];
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel, true);
                        return true;
                    }
                    if (["cancel", "leave", "close"].includes(cmd.toLowerCase())) {
                        let embed = new MessageEmbed({
                            title: `Embed building cancelled`,
                            color: guild.configuration.colors.main
                        });
                        message.channel.send({
                            embeds: [embed]
                        }).then(msg => {}).catch(e => {
                            MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            return false;
                        });
                        delete guild.waitingForMessage.data.makeembed[message.author.id];
                        delete guild.waitingForMessage.users[message.author.id];
                        return true;
                    }
                    if (cmd.toLowerCase() == "sendembed") {
                        message.delete().catch(e => {
                            MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        });
                        sendEmbed(guild.waitingForMessage.data.makeembed[message.author.id], message.channel);
                        delete guild.waitingForMessage.data.makeembed[message.author.id];
                        delete guild.waitingForMessage.users[message.author.id];
                        return true;
                    }
                    if (cmd.toLowerCase() == "exportjson") {
                        let exportDataObj = JSON.parse(JSON.stringify(guild.waitingForMessage.data.makeembed[message.author.id]));
                        delete exportDataObj.creator;
                        let exportData = JSON.stringify(exportDataObj);
                        exportData = exportData.replaceAll("```", "");
                        if (exportData.length <= 1850) {
                            message.channel.send(`Codeblocks are removed because its sent in a codeblock, f. You need to add them back.\`\`\`json\n${exportData}\`\`\``);
                        } else {
                            message.channel.send(`JSON is too large, ill implement a fix onee day`);
                        }
                        delete guild.waitingForMessage.users[message.author.id];
                        return true;
                    }
                    if (message.content.startsWith(`loadjson{`)) {
                        if (!message.content.startsWith(`loadjson{`)) {
                            let embed = new MessageEmbed({
                                title: `Wrong synthax`,
                                color: guild.configuration.colors.error,
                                description: `\`loadjson{}\` with \`{}\` as your json.`
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            message.delete().catch(e => {
                                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            });
                            return true;
                        }
                        let jsonToImport = message.content.replace('loadjson{', '{');
                        try {
                            let parsedJson = JSON.parse(jsonToImport);
                            guild.waitingForMessage.data.makeembed[message.author.id] = parsedJson;
                            let embed = new MessageEmbed({
                                title: `Loaded JSON`,
                                color: guild.configuration.colors.success
                            });
                            message.delete().catch(e => {
                                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            return true;
                        } catch (e) {
                            let embed = new MessageEmbed({
                                title: `Wrong JSON`,
                                color: guild.configuration.colors.error,
                                description: `${e}`
                            });
                            message.delete().catch(e => {
                                MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            return true;
                        }
                    }
                    if (cmd.toLowerCase() == "saveembed" && false) {
                        if (typeof args[0] == "undefined" || args[0] == "" || (args[0] == "-public" && (typeof args[1] == "undefined" || args[1] == ""))) {
                            let embed = new MessageEmbed({
                                title: `You must specify a name for it`,
                                color: guild.configuration.colors.error
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            return true;
                        }
                        let embed = new MessageEmbed({
                            title: `Embed saved \`${args[0]}\``,
                            color: guild.configuration.colors.main
                        });

                        if (args.includes('-public')) {
                            args = args.filter(arrayItem => arrayItem !== `-public`);
                            if (typeof guild.embedsManager.get(`sharedEmbeds.${args[0]}`) != "undefined") {
                                let embed = new MessageEmbed({
                                    title: `You already saved an embed with this name.`,
                                    color: guild.configuration.colors.error
                                });
                                message.channel.send({
                                    embeds: [embed]
                                }).then(msg => {}).catch(e => {
                                    MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                    return false;
                                });
                                return true;
                            }
                            guild.embedsManager.set(`sharedEmbeds.${args[0]}`, guild.waitingForMessage.data.makeembed[message.author.id]);
                            embed.title = `Embed saved \`${args[0]}\` [PUBLIC]`;
                        } else if (typeof guild.embedsManager.get(`userEmbeds.${message.author.id}.${args[0]}`) != "undefined") {
                            let embed = new MessageEmbed({
                                title: `You already saved an embed with this name.`,
                                color: guild.configuration.colors.error
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            return true;
                        } else {
                            guild.embedsManager.set(`userEmbeds.${message.author.id}.${args[0]}`, guild.waitingForMessage.data.makeembed[message.author.id]);
                        }


                        message.channel.send({
                            embeds: [embed]
                        }).then(msg => {}).catch(e => {
                            MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            return false;
                        });
                        delete guild.waitingForMessage.users[message.author.id];
                        return true;
                    }
                    if (cmd.toLowerCase() == "loadembed" && false) {
                        if (typeof args[0] == "undefined" || args[0] == "" || (args[0] == "-public" && (typeof args[1] == "undefined" || args[1] == ""))) {
                            let embed = new MessageEmbed({
                                title: `You must specify the embed you want to load`,
                                color: guild.configuration.colors.error
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            return true;
                        }
                        let embed = new MessageEmbed({
                            title: `Embed loaded \`${args[0]}\``,
                            color: guild.configuration.colors.main
                        });

                        if (args.includes('-public')) {
                            args = args.filter(arrayItem => arrayItem !== `-public`);
                            if (typeof guild.embedsManager.get(`sharedEmbeds.${args[0]}`) == "undefined") {
                                let embed = new MessageEmbed({
                                    title: `Could not find a matching embed.`,
                                    color: guild.configuration.colors.error
                                });
                                message.channel.send({
                                    embeds: [embed]
                                }).then(msg => {}).catch(e => {
                                    MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                    return false;
                                });
                                return true;
                            }
                            guild.waitingForMessage.data.makeembed[message.author.id] = guild.embedsManager.get(`sharedEmbeds.${args[0]}`);
                        } else if (typeof guild.embedsManager.get(`userEmbeds.${message.author.id}.${args[0]}`) == "undefined") {
                            let embed = new MessageEmbed({
                                title: `Could not find a matching embed.`,
                                color: guild.configuration.colors.error
                            });
                            message.channel.send({
                                embeds: [embed]
                            }).then(msg => {}).catch(e => {
                                MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                                return false;
                            });
                            return true;
                        } else {
                            guild.waitingForMessage.data.makeembed[message.author.id] = guild.embedsManager.get(`userEmbeds.${message.author.id}.${args[0]}`);
                        }
                        message.channel.send({
                            embeds: [embed]
                        }).then(msg => {}).catch(e => {
                            MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            return false;
                        });
                        return true;
                    }
                    if (cmd.toLowerCase() == "listembeds" && false) {
                        let embed = new MessageEmbed({
                            title: `Your saved embeds :`,
                            color: guild.configuration.colors.main
                        });

                        let savedEmbeds = [];
                        if (args.includes('-public')) {
                            embed.title = `Publicly saved embeds :`;
                            guild.embedsManager.load();
                            console.log(guild.embedsManager.configuration)
                            if (typeof guild.embedsManager.get(`sharedEmbeds`) == "object" && Object.keys(guild.embedsManager.get(`sharedEmbeds`)).length != 0) {
                                for (const savedEmbeds in guild.embedsManager.get(`sharedEmbeds`)) {
                                    console.log(savedEmbeds)
                                    if (typeof savedEmbeds == "object" && Object.keys(savedEmbeds).length != 0)for (const indEmbed in savedEmbeds) {
                                        embed.addField(`${indEmbed}`, `Created by : <@${savedEmbeds[indEmbed].creator}>`, true);
                                    }
                                }
                            }
                        } else {
                            if (typeof guild.embedsManager.get(`userEmbeds.${message.author.id}`) == "object" && Object.keys(guild.embedsManager.get(`userEmbeds.${message.author.id}`)).length != 0) {
                                for (const indEmbed in guild.embedsManager.get(`userEmbeds.${message.author.id}`)) {
                                    embed.addField(`${indEmbed}`, `Created by : <@${guild.embedsManager.get(`userEmbeds.${message.author.id}.${indEmbed}.creator`)}>`, true);
                                }
                            }
                        }
                        embed.addFields(savedEmbeds);
                        message.channel.send({
                            embeds: [embed]
                        }).then(msg => {}).catch(e => {
                            MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                            return false;
                        });
                        return true;
                    }
                    let embed = new MessageEmbed({
                        title: `Unknown command`,
                        color: guild.configuration.colors.error,
                        description: `You are still in embed creation mode and this command is unknown. You can say \`cancel\` to leave this mode or say \`saveembed\` to save your progress and load it back later.`
                    });
                    message.channel.send({
                        embeds: [embed]
                    }).then(msg => {}).catch(e => {
                        MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                        return false;
                    });
                    message.delete().catch(e => {
                        MainLog.log(`Could not delete message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not delete message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                    return true;
                }
            }
        }).catch(e => {
            MainLog.log(`Could not reply to message ${message.id} in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not reply to message ${message.id} in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
        });
        return true;
    }
}

async function sendEmbed(makeembedData, channel, preview = false) {
    if (typeof makeembedData.title != "string" || makeembedData.title == ``) return false;
    let embed = new MessageEmbed({
        title: `${makeembedData.title}`,
    });
    if (typeof makeembedData.description == "string" && makeembedData.description != `` && makeembedData.description != `none`) embed.description = makeembedData.description.replace('\\n', '\n');
    if (typeof makeembedData.color == "string" && makeembedData.title != `` && makeembedData.description != `none`) embed.color = makeembedData.color;
    if (typeof makeembedData.url == "string" && makeembedData.url != `` && makeembedData.url != `none` && makeembedData.url.startsWith('https://')) embed.url = makeembedData.url;
    if (typeof makeembedData.image == "string" && makeembedData.image != `` && makeembedData.image != `none` && makeembedData.image.startsWith('https://')) embed.image = {
        url: makeembedData.image
    };
    if (typeof makeembedData.thumbnail == "string" && makeembedData.thumbnail != `` && makeembedData.thumbnail != `none` && makeembedData.thumbnail.startsWith('https://')) embed.thumbnail = {
        url: makeembedData.thumbnail
    };
    if (typeof makeembedData.author == "string" && makeembedData.author != `` && makeembedData.author != `none`) embed.author = {
        name: makeembedData.author
    };
    if (typeof makeembedData.authorurl == "string" && makeembedData.authorurl != `` && makeembedData.authorurl != `none` && makeembedData.authorurl.startsWith('https://'))
        if (typeof embed.author == "object") {
            embed.author.url = makeembedData.authorurl;
        } else {
            embed.author = {
                url: makeembedData.authorurl
            };
        };
    if (typeof makeembedData.footer == "string" && makeembedData.footer != `` && makeembedData.footer != `none`) embed.footer = {
        text: makeembedData.footer
    };
    if (typeof makeembedData.footerimage == "string" && makeembedData.footerimage != `` && makeembedData.footerimage != `none` && makeembedData.footerimage.startsWith('https://'))
        if (typeof embed.footer == "object") {
            embed.footer.icon_url = makeembedData.footerimage;
        } else {
            embed.footer = {
                icon_url: makeembedData.footerimage
            };
        };
    makeembedData.fields.forEach(indField => {
        embed.addField(indField[0], indField[1], indField[2]);
    });
    channel.send({
        embeds: [embed]
    }).then(msg => {
        if (preview) channel.send(`^ Embed preview`).catch(e => {});
        return true;
    }).catch(e => {
        MainLog.log(`Could not send message [${message.id}] in [${message.channel.id}][${message.channel.guild.id}] Error : ${e}`.red); //Logging in file & console
        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not send message [${message.id}] in [<#${message.channel.id}>(${message.channel.id})] Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
        return false;
    });
}