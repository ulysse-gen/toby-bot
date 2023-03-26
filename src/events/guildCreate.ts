/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules

//Importing classes
import FileLogger from '../classes/FileLogger';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default {
    name: 'guildCreate',
    once: true,
    async exec(TobyBot, guild) {
        if (TobyBot.ready)return false;
        MainLog.log(TobyBot.i18n.__('bot.joinedGuild', {guildName: guild.name, guildId: guild.id}));

        let Guild = TobyBot.GuildManager.getGuild(guild).catch(e => { 
            ErrorLog.error(`An error occured trying to fetch the guild:`);
            console.log(e);
            return;
        });
        return true;
    }
}