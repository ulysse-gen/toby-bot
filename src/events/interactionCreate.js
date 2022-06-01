/////////////////////////////////
//interaction create event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('../classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async exec(TobyBot, interaction) {
        if (typeof TobyBot == "undefined")throw `${__filename}(): TobyBot is undefined.`;
        interaction.TobyBot = {TobyBot: TobyBot};

        if (typeof TobyBot.ConfigurationManager.get('blocked.users')[interaction.user.id] != "undefined")return false;
        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[interaction.guildId] != "undefined")return false;

        interaction.TobyBot.guild = await TobyBot.GuildManager.getGuild(interaction.member.guild).catch(e => { 
            return ErrorLog.error(`${__filename}: An error occured trying to fetch the guild.`);
        });

        if (typeof interaction.TobyBot.guild == "undefined" || !interaction.TobyBot.guild.initialized) return false;

        if (interaction.isCommand()) {
            let commandHandling = await TobyBot.CommandManager.handle(interaction);


            return (commandHandling) ? true : interaction.reply({
                content: interaction.TobyBot.guild.i18n.__('interaction.slashCommand.notBuilt', {prefix:  interaction.TobyBot.guild.ConfigurationManager.get('prefix')}),
                ephemeral: true
            }).catch(e => { throw e; });
        }

        return interaction.reply({
            content: interaction.TobyBot.guild.i18n.__('interaction.couldNotProcess'),
            ephemeral: true,
        }).catch(e => { throw e; });
    }
}