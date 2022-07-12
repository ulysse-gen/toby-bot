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

        if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).create(TobyBot, message);

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[message.channel.guild.id] != "undefined")return false;

        message.TobyBot.guild = await TobyBot.GuildManager.getGuild(message.channel.guild).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the guild:`);
            console.log(e);
            return undefined;
        });

        if (typeof message.TobyBot.guild == "undefined" || !message.TobyBot.guild.initialized) return false;

        message.TobyBot.user = await TobyBot.UserManager.getUser(message.author).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the user:`);
            console.log(e);
            return undefined;
        });

        message.TobyBot.guild.MessageManager.addMessage(message).catch(e => { 
            ErrorLog.error(`An error occured trying to log the message:`);
            console.log(e);
        }); //Log messages

        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself
        if (message.type == "APPLICATION_COMMAND" || message.author.bot) return; //Skip if its a bot or an app message

        let commandExecution = await TobyBot.CommandManager.handle(message).catch(e => {
            ErrorLog.error(`An error occured during the handling of the CommandManager handle:`);
            console.log(e);
            return undefined;
        });

        if (!commandExecution){
            let waitingForMessage = await message.TobyBot.guild.waitingForMessage(message).catch(e => {
                ErrorLog.error(`An error occured during the handling of the Guild waitingForMessage:`);
                console.log(e);
                return undefined;
            });
    
            if (typeof waitingForMessage == "boolean" && waitingForMessage)return true;
        }

        return true;
    }
}