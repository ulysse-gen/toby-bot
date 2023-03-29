/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules
import colors from 'colors';

//Importing classes
import FileLogger from '../classes/FileLogger';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default {
    name: 'guildMemberAdd',
    once: true,
    async exec(TobyBot, GuildMember) {
        if (!TobyBot.ready)return false;

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[GuildMember.guild.id] != "undefined")return false;

        let Guild = await TobyBot.GuildManager.getGuild(GuildMember.guild).catch(e => { 
            return ErrorLog.error(`${__filename}: An error occured trying to fetch the guild.`);
        });

        if (typeof Guild == "undefined" || !Guild.initialized) return false;

        if (await Guild.ModerationManager.isUserPunished(GuildMember.guild.id, 'Mute'))await Guild.autoReMute(GuildMember);
        
        //MainLog.log(`${GuildMember.user.username} just joined ${GuildMember.guild.name}`);
        return true;
    }
}