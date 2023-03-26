/////////////////////////////////
//interaction create event handler
/////////////////////////////////

//Importing classes
import FileLogger from '../classes/FileLogger';
import CommandExecution from '../classes/CommandExecution';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default {
    name: 'interactionCreate',
    once: false,
    enabled: true,
    async exec(TobyBot, interaction) {
        if (process.env.TOBYBOT_API_ONLY === "true")return true;
        if (!TobyBot.ready)return false;
        interaction.TobyBot = {TobyBot: TobyBot};

        if (typeof TobyBot.ConfigurationManager.get('blocked.users')[interaction.user.id] != "undefined")return false;
        if (typeof TobyBot.ConfigurationManager.get('blocked.guilds')[interaction.guildId] != "undefined")return false;

        interaction.TobyBot.Guild = await TobyBot.GuildManager.getGuild(interaction.member.guild);

        interaction.TobyBot.User = await TobyBot.UserManager.getUser(interaction.user);

        if (typeof interaction.TobyBot.Guild == "undefined" || !interaction.TobyBot.Guild.initialized) return false;

        if (interaction.isCommand())return TobyBot.CommandManager.handleSlash(interaction).catch(e => {
            ErrorLog.error(`${__filename}: An error occured while processing the command:`);
            console.log(e);
            return interaction.reply({
                content: interaction.TobyBot.Guild.i18n.__('interaction.slashCommand.notBuilt', {prefix:  interaction.TobyBot.Guild.ConfigurationManager.get('prefix')}),
                ephemeral: true
            });
        });

        if (interaction.isUserContextMenu())return TobyBot.ContextMenuCommandManager.handleContextMenu(interaction).catch(e => {
            ErrorLog.error(`${__filename}: An error occured while processing the command:`);
            console.log(e);
            return interaction.reply({
                content: interaction.TobyBot.Guild.i18n.__('interaction.contextMenu.notBuilt'),
                ephemeral: true
            });
        });

        if (interaction.isButton()){
            if (typeof interaction.TobyBot.Guild.waitingForInteractionData == "function")return interaction.TobyBot.Guild.waitingForInteractionData[interaction.customId](interaction);

            if (interaction.customId.startsWith('russianroulette-')){
                let InteractionId = interaction.customId;
                let Action = InteractionId.split('-')[1];
                let RRID = InteractionId.split('-')[2];

                if (typeof interaction.TobyBot.Guild.data.russianroulette.channels[interaction.channelId] == "undefined")return interaction.reply({
                    content: interaction.TobyBot.Guild.i18n.__('interaction.russianroulette.notRunningInChannel'),
                    ephemeral: true
                });

                let russianRoulette = interaction.TobyBot.Guild.data.russianroulette.channels[interaction.channelId];

                if (RRID != russianRoulette.id)return interaction.reply({
                    content: interaction.TobyBot.Guild.i18n.__('interaction.russianroulette.wrongId'),
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
            content: interaction.TobyBot.Guild.i18n.__('interaction.couldNotProcess'),
            ephemeral: true,
        });
    }
}