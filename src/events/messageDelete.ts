/////////////////////////////////
//Message delete event handler
/////////////////////////////////

//Importing classes
import FileLogger from '../classes/FileLogger';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default {
    name: 'messageDelete',
    once: false,
    async exec(TobyBot, message) {
        if (!TobyBot.ready)return false;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).deleteMessage(TobyBot, message);

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[message.channel.guild.id] != "undefined")return false;

        message.TobyBot.Guild = await TobyBot.GuildManager.getGuild(message.channel.guild);

        if (typeof message.TobyBot.Guild == "undefined" || !message.TobyBot.Guild.initialized) return false;

        if (message.type == "APPLICATION_COMMAND" || !message.author || message.author.bot) return; //Skip if its a bot or an app message or user is not defined
        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself

        message.TobyBot.User = await TobyBot.UserManager.getUser(message.author);

        message.TobyBot.Guild.MessageManager.deleteMessage(message);

        return true;
    }
}