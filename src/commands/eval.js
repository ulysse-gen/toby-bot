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
            if (typeof evalValue != "undefined")return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.error.successExecution.title`), CommandExecution.i18n.__(`command.${this.name}.error.successExecution.description`, {evalValue: evalValue}));
            return CommandExecution.returnMainEmbed({slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.error.successExecution.title.noReturn`));
        } catch (error) {
            return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.title`), CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.description`, {error: error}));
        }
    },
    optionsFromArgs (args) {
        var options = {};
        options.code = args.join(' ');
        return options;
    },
    optionsFromSlashOptions (slashOptions) {
        var options = Object.fromEntries(Object.entries(slashOptions).map(([key, val]) => [val.name, val.value]));
        return options;
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
    }
}