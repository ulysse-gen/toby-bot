/////////////////////////////////
//Message update event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('../classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = {
    name: 'messageUpdate',
    once: false,
    async exec(TobyBot, oldMessage, message) {
        if (typeof TobyBot == "undefined")throw `${__filename}(): TobyBot is undefined.`;
        if (TobyBot.ready)return false;
        message.TobyBot = {TobyBot: TobyBot};

        if (typeof message.channel.guild == "undefined") return require(`./DMHandler`).update(TobyBot, message);

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

        message.TobyBot.guild.MessageManager.updateMessage(oldMessage, message).catch(e => { 
            ErrorLog.error(`An error occured trying to update the message log:`);
            console.log(e);
        }); //Log messages update*/

        if (message.author.id == TobyBot.client.user.id) return; //Skip if himself
        if (message.type == "APPLICATION_COMMAND" || message.author.bot) return; //Skip if its a bot or an app message
        return true;
    }
}