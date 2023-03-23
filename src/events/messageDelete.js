/////////////////////////////////
//Message delete event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('/app/src/classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = {
    name: 'messageDelete',
    once: false,
    async exec(TobyBot, message) {
        if (!TobyBot.ready)return false;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).delete(TobyBot, message);

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[message.channel.guild.id] != "undefined")return false;

        message.TobyBot.Guild = await TobyBot.GuildManager.getGuild(message.channel.guild).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the guild:`);
            console.log(e);
            return undefined;
        });

        if (typeof message.TobyBot.Guild == "undefined" || !message.TobyBot.Guild.initialized) return false;

        if (message.type == "APPLICATION_COMMAND" || !message.author || message.author.bot) return; //Skip if its a bot or an app message or user is not defined
        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself

        message.TobyBot.user = await TobyBot.UserManager.getUser(message.author).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the user:`);
            console.log(e);
            return undefined;
        });

        message.TobyBot.Guild.MessageManager.deleteMessage(message).catch(e => { 
            ErrorLog.error(`An error occured trying to update the message log:`);
            console.log(e);
        }); //Log messages delete*/

        return true;
    }
}