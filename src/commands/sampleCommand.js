const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "samplecommand",
    aliases: ["samplecommand"],
    description: "samplecommand",
    permission: "command.samplecommand",
    category: "samplecommand",
    enabled: true,
    async execute(CommandExecution) {
        return true;
    },
    optionsFromArgs (CommandExecution) {
        var options = {};
        return options;
    },
    optionsFromSlashOptions (CommandExecution) {
        return Object.fromEntries(Object.entries(CommandExecution.commandOptions).map(([key, val]) => [val.name, val.value]));
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addStringOption(option => 
            option.setName('sampleoption')
                .setDescription(i18n.__(`command.${this.name}.option.sampleoption.description`))
                .setRequired(true)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('sampleoption', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.sampleoption.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.text`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}