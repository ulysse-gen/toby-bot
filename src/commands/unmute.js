const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "unmute",
    aliases: ["unmuteuser", "unmutemember"],
    permission: "command.unmute",
    category: "moderation",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
        if (typeof CommandExecution.options.reason == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.description`, {}));
    
        let User = await CommandExecution.guild.getUserFromArg(CommandExecution.options.target);
        if (typeof User == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));

        await CommandExecution.guild.ModerationManager.unMuteUser(CommandExecution, User, CommandExecution.options.reason);
        return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.userUnmuted.title`));
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.commandOptions.length == 0)return options;
        options.target = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.reason = CommandExecution.commandOptions.join(' ');
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

        slashCommand.addUserOption(option => 
            option.setName('target')
                .setDescription(i18n.__(`command.${this.name}.option.target.description`))
                .setRequired(true)
        );

        slashCommand.addStringOption(option => 
            option.setName('reason')
                .setDescription(i18n.__(`command.${this.name}.option.reason.description`))
                .setRequired(true)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('target', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.target.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));
        tempEmbed.addField('reason', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.reason.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.string`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}