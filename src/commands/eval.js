const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "eval",
    aliases: [],
    permission: "command.eval",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.code == "undefined" || CommandExecution.options.code.replaceAll(' ', '') == "") throw {title: CommandExecution.i18n.__('commands.generic.error.title'), content: CommandExecution.i18n.__(`command.${this.name}.error.codeMustExistNotEmpty`)};
        try {
            let evalValue = eval(CommandExecution.options.code);
            if (typeof evalValue != "undefined")return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.successExecution.title`), CommandExecution.i18n.__(`command.${this.name}.successExecution.description`, {evalValue: evalValue}));
            return CommandExecution.returnMainEmbed({slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.successExecution.title.noReturn`));
        } catch (error) {
            return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.title`), CommandExecution.i18n.__(`command.${this.name}.failedExecution.description`, {error: error}));
        }
    },
    optionsFromArgs (CommandExecution) {
        var options = {};
        options.code = args.join(' ');
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
            option.setName('code')
                .setDescription(i18n.__(`command.${this.name}.option.code.description`))
                .setRequired(true)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription('**' + Command.CommandManager.i18n.__(`command.${this.name}.description`) + '**\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('code', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.code.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.text`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}