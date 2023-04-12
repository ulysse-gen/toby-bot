import { DMChannel, MessageEmbed } from 'discord.js';


import FileLogger from '../classes/FileLogger';
import TobyBot from '../classes/TobyBot';
import { TobyBotMessage } from '../interfaces/main';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export async function create (TobyBot: TobyBot, message: TobyBotMessage) {
    if (message.content.startsWith(`dm!`))
        if (["231461358200291330","330826518370451457"].includes(message.author.id)){
            let args = message.content.split(' ');
            let command = args.shift().replace("dm!", "");


            if (command.toLowerCase() == "removemessage") {
                message.author.fetch().then(u => {
                    u.dmChannel.messages.fetch(args[0]).then(m => {
                        m.delete().catch(e => {
                            message.reply(`Could not delete this message. ${e.toString()}`);
                        });
                    }).catch(e => {
                        message.reply(`Could not fetch this message. ${e.toString()}`);
                    });
                }).catch(e => {
                    message.reply(`Could not fetch this DM channel. ${e.toString()}`);
                });
            }
            return true;
        }


    let way = (message.author.id != TobyBot.client.user.id) ? "incoming" : "outgoing";
    let user = (message.channel as DMChannel).recipient;

    let embed = new MessageEmbed().setTitle(TobyBot.i18n.__(`channelLogging.DM.${way}.title`)).setDescription(TobyBot.i18n.__('channelLogging.DM.description', {content: `${message.content}`, attachments: (message.attachments.values.length == 0) ? `None` : `[**URL**](${message.attachments.values.toString()})`, stickers: (typeof message.stickers.values == "undefined" || message.stickers.values.length == 0) ? `None` : `[**URL**](${message.stickers.values.toString()})`})).setColor(TobyBot.ConfigurationManager.get('style.colors.main'));
    embed.addField(TobyBot.i18n.__('channelLogging.DM.field.user.title'), TobyBot.i18n.__('channelLogging.DM.field.user.description', {userId: user.id}), true);
    embed.addField(TobyBot.i18n.__('channelLogging.DM.field.embeds.title'), TobyBot.i18n.__('channelLogging.DM.field.embeds.description', {embeds: (typeof message.embeds != "object") ? "false" : message.embeds.length.toString()}), true);

    let LogOnlyTo = {
        "456302087207256067": "231461358200291330"
    }

    if (typeof LogOnlyTo[message.author.id] != "undefined") return TobyBot.client.users.fetch(LogOnlyTo[message.author.id]).then(user => user.send({embeds: [embed]}).catch(e => {})).catch(e => {});

    if (await TobyBot.ConfigurationManager.get('logging.DM')) {
        if ((await TobyBot.ConfigurationManager.get('logging.DM.inConsole')))MainLog.log(TobyBot.i18n.__(`bot.dm.${way}`, {user: `${user.username}#${user.discriminator}(${user.id})`, content: message.content}));
        if ((await TobyBot.ConfigurationManager.get('logging.DM.inChannel')) && typeof TobyBot.loggers["DM"] != "undefined"){
            TobyBot.loggers.DM.logRaw({embeds: [embed]});
        }
    }

    return;
}

export async function update(TobyBot, message) {
    return;
}

export async function deleteMessage(TobyBot, message) {
    return;
}