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
        if (!TobyBot.ready)return false;
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

        if (interaction.isButton()){
            if (typeof interaction.TobyBot.guild.waitingForInteractionData == "function")return interaction.TobyBot.guild.waitingForInteractionData[interaction.customId](interaction);

            if (interaction.customId.startsWith('russianroulette-')){
                let InteractionId = interaction.customId;
                let Action = InteractionId.split('-')[1];
                let RRID = InteractionId.split('-')[2];

                if (typeof interaction.TobyBot.guild.data.russianroulette.channels[interaction.channelId] == "undefined")return interaction.reply({
                    content: interaction.TobyBot.guild.i18n.__('interaction.russianroulette.notRunningInChannel'),
                    ephemeral: true
                });

                let russianRoulette = interaction.TobyBot.guild.data.russianroulette.channels[interaction.channelId];

                if (RRID != russianRoulette.id)return interaction.reply({
                    content: interaction.TobyBot.guild.i18n.__('interaction.russianroulette.wrongId'),
                    ephemeral: true
                });

                if (Action == "join")return russianRoulette.joinByInteraction(interaction);
                if (Action == "leave")return russianRoulette.leaveByInteraction(interaction);
                if (Action == "cancel")return russianRoulette.cancelByInteraction(interaction);
                if (Action == "stop")return russianRoulette.stopByInteraction(interaction);
                if (Action == "alive")return russianRoulette.amIAliveByInteraction(interaction);
            }
        }

        return interaction.reply({
            content: interaction.TobyBot.guild.i18n.__('interaction.couldNotProcess'),
            ephemeral: true,
        });
    }
}