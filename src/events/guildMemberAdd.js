/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules
const colors = require('colors');

//Importing classes
const FileLogger = require('/app/src/classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = {
    name: 'guildMemberAdd',
    once: true,
    async exec(TobyBot, GuildMember) {
        if (!TobyBot.ready)return false;

        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[GuildMember.guild.id] != "undefined")return false;

        let Guild = await TobyBot.GuildManager.getGuild(GuildMember.guild).catch(e => { 
            return ErrorLog.error(`${__filename}: An error occured trying to fetch the guild.`);
        });

        if (typeof Guild == "undefined" || !Guild.initialized) return false;

        if (Guild.ModerationManager.isUserPunished(GuildMember.guild.id, 'Mute'))await Guild.autoReMute(GuildMember);
        
        //MainLog.log(`${GuildMember.user.username} just joined ${GuildMember.guild.name}`);
        return true;
    }
}