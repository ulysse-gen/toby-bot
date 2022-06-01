/////////////////////////////////
//Message create event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('../classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = {
    name: 'messageCreate',
    once: false,
    async exec(TobyBot, message) {
        if (typeof TobyBot == "undefined")throw `${__filename}(): TobyBot is undefined.`;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof TobyBot.ConfigurationManager.get('blocked.users')[message.author.id] != "undefined"){
            if (typeof message.channel.guild != "undefined") return false;
            MainLog.log(TobyBot.i18n.__("bot.blockedDm.log", {user: `${message.author.username}#${message.author.discriminator} (${message.author.id})`, message: message.content}));
            return message.author.send(TobyBot.u18n.__('bot.blockedDm.text'));
        }


        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[message.channel.guild.id] != "undefined")return false;

        message.TobyBot.guild = await TobyBot.GuildManager.getGuild(message.channel.guild).catch(e => { 
            return ErrorLog.error(`${__filename}: An error occured trying to fetch the guild.`);
        });

        if (typeof message.TobyBot.guild == "undefined" || !message.TobyBot.guild.initialized) return false;

        message.TobyBot.guild.MessageManager.addMessage(message).catch(e => { 
            return ErrorLog.error(`${__filename}: An error occured logging the message.`);
        }); //Log messages

        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself
        if (message.type == "APPLICATION_COMMAND" || message.author.bot) return; //Skip if its a bot or an app message

        let prefixes = [TobyBot.ConfigurationManager.get('prefixes'), message.TobyBot.guild.ConfigurationManager.get('prefixes'), message.TobyBot.guild.ConfigurationManager.get('prefix')].flat().filter((item, pos, self) => self.indexOf(item) == pos);
        let isACommand = prefixes.find(e => message.content.startsWith(e));

        if (typeof isACommand != "undefined")await TobyBot.CommandManager.handle(message, isACommand).catch(e => { 
            console.log(e);
            return ErrorLog.error(`${__filename}: An error occured while processing the command.`);
        });

        return true;
    }
}