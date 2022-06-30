const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "justtotrythewait",
    aliases: ["jtttw"],
    permission: "command.justtotrythewait",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        return setTimeout(() => {
            return CommandExecution.replyMainEmbed({}, 'oui', 'non');
        }, 5000);
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.commandOptions.length == 0)return options;
        options.subCommand = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.key = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.value = CommandExecution.commandOptions.join(' ');
        return options;
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
                                            .setColor(Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription('**' + Command.CommandManager.i18n.__(`command.${this.name}.description`) + '**\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}