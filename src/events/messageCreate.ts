/////////////////////////////////
//Message create event handler
/////////////////////////////////

//Importing classes
import { Message, TextChannel } from 'discord.js';
import { CommandHandlingError, WaitingForMessageError } from '../classes/Errors';
import FileLogger from '../classes/FileLogger';
import TobyBot from '../classes/TobyBot';
import TobyBotUser from '../classes/TobyBotUser';
import { TobyBotMessage } from '../interfaces/main';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default {
    name: 'messageCreate',
    once: false,
    async exec(TobyBot: TobyBot, message: TobyBotMessage) {
        if (!TobyBot.ready)return false;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof TobyBot.ConfigurationManager.get('blocked.users')[message.author.id] != "undefined"){
            if (typeof (message.channel as TextChannel).guild != "undefined") return false;
            MainLog.log(TobyBot.i18n.__("bot.blockedDm.log", {user: `${message.author.username}#${message.author.discriminator} (${message.author.id})`, message: message.content}));
            return message.author.send(TobyBot.i18n.__('bot.blockedDm.text'));
        }

        if (typeof (message.channel as TextChannel).guild == "undefined") return require(`./DMHandler`).create(TobyBot, message);

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[(message.channel as TextChannel).guild.id] != "undefined")return false;

        message.TobyBot.Guild = await TobyBot.GuildManager.getGuild((message.channel as TextChannel).guild);

        if (typeof message.TobyBot.Guild == "undefined" || !message.TobyBot.Guild.initialized) return false;

        if (message.type == "APPLICATION_COMMAND" || !message.author || message.author.bot) return; //Skip if its a bot or an app message or user is not defined
        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself

        message.TobyBot.User = await new TobyBotUser(TobyBot, message.author).initialize();

        message.TobyBot.Guild.MessageManager.addMessage(message);

        /** Disabling AutoModeration cuz not any close to be done, and other things are prioritized over this.
        let autoMod = await TobyBot.AutoModeration.examine(message);
        console.log(autoMod);
        **/

        let commandExecution = await TobyBot.CommandManager.handle(message).catch(e => {
            throw new CommandHandlingError(`An error occured trying to handle the command.`, {cause: e}).logError();
        });

        if (!commandExecution){
            let waitingForMessage = await message.TobyBot.Guild.waitingForMessage(message).catch(e => {
                throw new WaitingForMessageError(`An error occured trying to handle the waitingForMessage.`, {cause: e}).logError();
            });
    
            if (typeof waitingForMessage == "boolean" && waitingForMessage)return true;
        }

        return true;
    }
}