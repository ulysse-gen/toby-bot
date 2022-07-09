const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const FileLogger = require('../classes/FileLogger');

const MainLog = new FileLogger();

module.exports = {
    name: "reload",
    aliases: ["rl"],
    permission: "command.reload",
    category: "administration",
    enabled: false,
    async execute(CommandExecution) {
        Object.keys(require.cache).forEach(function(key) { 
            key = key.replace(process.cwd(), '');
            if (key.startsWith('\\src\\commands'))delete require.cache[key];
            if (key.startsWith('\\configurations'))delete require.cache[key];
            if (!key.startsWith('\\node_modules'))MainLog.log(key);
            //delete require.cache[key]
        });
        await CommandExecution.TobyBot.attachEvents();
        CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.reloaded.title`))
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}