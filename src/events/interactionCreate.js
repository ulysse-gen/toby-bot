/////////////////////////////////
//interaction create event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('../classes/FileLogger');
const CommandExecution = require('../classes/CommandExecution');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = {
    name: 'interactionCreate',
    once: false,
    enabled: true,
    async exec(TobyBot, interaction) {
        if (TobyBot.TopConfigurationManager.get('API.only'))return true;
        if (typeof TobyBot == "undefined")throw `${__filename}(): TobyBot is undefined.`;
        if (TobyBot.ready)return false;
        interaction.TobyBot = {TobyBot: TobyBot};

        if (typeof TobyBot.ConfigurationManager.get('blocked.users')[interaction.user.id] != "undefined")return false;
        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[interaction.guildId] != "undefined")return false;

        interaction.TobyBot.guild = await TobyBot.GuildManager.getGuild(interaction.member.guild).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the guild:`);
            console.log(e);
            return undefined;
        });

        interaction.TobyBot.user = await TobyBot.UserManager.getUser(interaction.user).catch(e => { 
            ErrorLog.error(`${__filename}: An error occured trying to fetch the user:`);
            console.log(e);
            return undefined;
        });

        if (typeof interaction.TobyBot.guild == "undefined" || !interaction.TobyBot.guild.initialized) return false;

        if (interaction.isCommand())return TobyBot.CommandManager.handleSlash(interaction).catch(e => {
            ErrorLog.error(`${__filename}: An error occured while processing the command:`);
            console.log(e);
            return interaction.reply({
                content: interaction.TobyBot.guild.i18n.__('interaction.slashCommand.notBuilt', {prefix:  interaction.TobyBot.guild.ConfigurationManager.get('prefix')}),
                ephemeral: true
            });
        });

        if (interaction.isUserContextMenu())return TobyBot.ContextMenuCommandManager.handleContextMenu(interaction).catch(e => {
            ErrorLog.error(`${__filename}: An error occured while processing the command:`);
            console.log(e);
            return interaction.reply({
                content: interaction.TobyBot.guild.i18n.__('interaction.contextMenu.notBuilt'),
                ephemeral: true
            });
        });

        return interaction.reply({
            content: interaction.TobyBot.guild.i18n.__('interaction.couldNotProcess'),
            ephemeral: true,
        });
    }
}