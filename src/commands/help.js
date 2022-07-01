const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "help",
    aliases: ["?"],
    permission: "command.help",
    category: "informations",
    enabled: true,
    async execute(CommandExecution) {
        CommandExecution.returnMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.mainEmbed.title`), CommandExecution.i18n.__(`command.${this.name}.mainEmbed.description`));
        
        
        /*
        How config will be done: 
        
        let temp = await CommandExecution.CommandManager.fetch('configuration');
        console.log(temp.slashCommand.toJSON());
        */

        return true;
        CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.generic.nothingHandling.title`), CommandExecution.i18n.__(`command.generic.nothingHandling.description`, {command: this.name}));
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        if (CommandExecution.commandOptions.length == 0)return {};
        return {};
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.commandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.trigger.options._subcommand != "undefined" && CommandExecution.trigger.options._subcommand != null) options.subCommand = CommandExecution.trigger.options._subcommand;
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