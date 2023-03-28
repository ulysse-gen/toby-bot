/////////////////////////////////
//Message update event handler
/////////////////////////////////

//Importing classes
import { Message, TextChannel } from 'discord.js';
import FileLogger from '../classes/FileLogger';
import TobyBot from '../classes/TobyBot';
import TobyBotUser from '../classes/TobyBotUser';
import { TobyBotMessage } from '../interfaces/main';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default {
    name: 'messageUpdate',
    once: false,
    async exec(TobyBot: TobyBot, oldMessage: Message, message: TobyBotMessage) {
        if (!TobyBot.ready)return false;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof (message.channel as TextChannel).guild == "undefined") return require(`./DMHandler`).update(TobyBot, message);

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[(message.channel as TextChannel).guild.id] != "undefined")return false;

        message.TobyBot.Guild = await TobyBot.GuildManager.getGuild((message.channel as TextChannel).guild);

        if (typeof message.TobyBot.Guild == "undefined" || !message.TobyBot.Guild.initialized) return false;

        if (message.type == "APPLICATION_COMMAND" || !message.author || message.author.bot) return; //Skip if its a bot or an app message or user is not defined
        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself

        if (!message.TobyBot.User)message.TobyBot.User = await new TobyBotUser(TobyBot, message.author).initialize();

        message.TobyBot.Guild.MessageManager.updateMessage(oldMessage, message);
        
        return true;
    }
}