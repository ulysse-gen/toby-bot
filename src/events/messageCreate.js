/////////////////////////////////
//Message create event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('/app/src/classes/FileLogger');
const { ErrorBuilder, ErrorType } = require('/app/src/classes/Errors');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = {
    name: 'messageCreate',
    once: false,
    async exec(TobyBot, message) {
        if (!TobyBot.ready)return false;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof TobyBot.ConfigurationManager.get('blocked.users')[message.author.id] != "undefined"){
            if (typeof message.channel.guild != "undefined") return false;
            MainLog.log(TobyBot.i18n.__("bot.blockedDm.log", {user: `${message.author.username}#${message.author.discriminator} (${message.author.id})`, message: message.content}));
            return message.author.send(TobyBot.u18n.__('bot.blockedDm.text'));
        }

        if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).create(TobyBot, message);

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[message.channel.guild.id] != "undefined")return false;

        message.TobyBot.Guild = await TobyBot.GuildManager.getGuild(message.channel.guild).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the guild:`);
            console.log(e);
            return undefined;
        });

        if (typeof message.TobyBot.Guild == "undefined" || !message.TobyBot.Guild.initialized) return false;

        if (message.type == "APPLICATION_COMMAND" || !message.author || message.author.bot) return; //Skip if its a bot or an app message or user is not defined
        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself

        message.TobyBot.User = await TobyBot.UserManager.getUser(message.author).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the user:`);
            console.log(e);
            return undefined;
        });

        message.TobyBot.Guild.MessageManager.addMessage(message).catch(e => { 
            ErrorLog.error(`An error occured trying to log the message:`);
            console.log(e);
        }); //Log messages

        /** Disabling AutoModeration cuz not any close to be done, and other things are prioritized over this.
        let autoMod = await TobyBot.AutoModeration.examine(message);
        console.log(autoMod);
        **/

        let commandExecution = await TobyBot.CommandManager.handle(message).catch(e => {
            throw new ErrorBuilder(`An error occured trying to handle the command.`, {cause: e}).setType(ErrorType.CommandHandling);
        });

        if (!commandExecution){
            let waitingForMessage = await message.TobyBot.Guild.waitingForMessage(message).catch(e => {
                throw new ErrorBuilder(`An error occured trying to handle the waitingForMessage.`, {cause: e}).setType(ErrorType.WaitingForMessage);
            });
    
            if (typeof waitingForMessage == "boolean" && waitingForMessage)return true;
        }

        return true;
    }
}