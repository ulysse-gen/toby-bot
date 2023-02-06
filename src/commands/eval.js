const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "evaluate",
    aliases: ["eval"],
    permission: "command.evaluate",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.code == "undefined" || CommandExecution.options.code.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noCodeSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCodeSpecified.description`, {}));
        try {
            let evalValue = eval(CommandExecution.options.code);
            if (typeof evalValue != "undefined")return CommandExecution.replySuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.successExecution.title`), CommandExecution.i18n.__(`command.${this.name}.successExecution.description`, {evalValue: evalValue}));
            return CommandExecution.replySuccessEmbed({slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.successExecution.title.noReturn`));
        } catch (error) {
            return CommandExecution.replyErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.title`), CommandExecution.i18n.__(`command.${this.name}.error.failedExecution.description`, {error: error}));
        }
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.code = CommandExecution.CommandOptions.join(' ');
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

        slashCommand.addStringOption(option => 
            option.setName('code')
                .setDescription(i18n.__(`command.${this.name}.option.code.description`))
                .setRequired(true)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let optionTypes = {
            1: 'subcommand',
            2: 'subcommand_group',
            3: 'string',
            4: 'integer',
            5: 'boolean',
            6: 'user',
            7: 'channel',
            8: 'role',
            9: 'mentionnable',
            10: 'number',
            11: 'attachment',
        }

        let HelpEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
        .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
        .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`));

        let slashCommandOptions = Command.slashCommand.options;
        slashCommandOptions.forEach(option => {
            HelpEmbed.addField(`**${option.name}**`, Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.${option.name}.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.` + optionTypes[option.type])}));
        })

        returnObject.embeds.push(HelpEmbed) 
        return returnObject;
    }
}