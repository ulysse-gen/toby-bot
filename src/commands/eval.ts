import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import CommandExecution from '../classes/CommandExecution';
import { I18n } from 'i18n';

module.exports = {
    name: "evaluate",
    aliases: ["eval"],
    permission: "command.evaluate",
    category: "administration",
    enabled: true,
    async execute(CommandExecution: CommandExecution) {
        if (typeof CommandExecution.options.code == "undefined" || CommandExecution.options.code.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noCodeSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCodeSpecified.description`, {}));
        try {
            let evalValue = eval(CommandExecution.options.code);
            if (typeof evalValue != "undefined")return CommandExecution.replySuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.successExecution.title`), CommandExecution.i18n.__(`command.${this.name}.successExecution.description`, {evalValue: evalValue}));
            return CommandExecution.replySuccessEmbed({slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.successExecutionNoReturn.title`));
        } catch (error) {
            return CommandExecution.replyErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.title`), CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.description`, {error: error}));
        }
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.code = CommandExecution.CommandOptions.join(' ');
        return options;
    },
    async optionsFromSlashOptions (CommandExecution: CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [(val as {name: string, value: string}).name, (val as {name: string, value: any}).value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n: I18n) {
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