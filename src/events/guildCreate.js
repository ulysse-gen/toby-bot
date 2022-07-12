/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules
const colors = require('colors');

//Importing classes
const FileLogger = require('../classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = {
    name: 'guildCreate',
    once: true,
    async exec(TobyBot, guild) {
        if (typeof TobyBot == "undefined")throw `${__filename}: TobyBot is undefined.`;
        MainLog.log(TobyBot.i18n.__('bot.joinedGuild', {guildName: guild.name, guildId: guild.id}));

        let Guild = TobyBot.GuildManager.getGuild(guild).catch(e => { 
            ErrorLog.error(`An error occured trying to fetch the guild:`);
            console.log(e);
            return;
        });
        return true;
    }
}