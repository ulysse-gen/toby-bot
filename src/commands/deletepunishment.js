const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "deletepunishment",
    aliases: ["deletepunish", "delpunish","deletewarn","delwarn","deletenote","delnote","deletesticky","delsticky"],
    permission: "command.deletepunishment",
    category: "moderation",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.caseid == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noCaseIdSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCaseIdSpecified.description`, {}));
        if (typeof CommandExecution.options.reason == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.description`, {}));
    
        let Punishment = await CommandExecution.Guild.ModerationManager.getPunishementByCaseId(CommandExecution.options.caseid);
        if (typeof Punishment == "undefined" || Punishment.status == "deleted")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.punishmentNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.punishmentNotFound.description`));

        if (["Mute", "Ban"].includes(Punishment.type) && ["active", "indefinite"].includes(Punishment.status))return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.punishmentActive.title`), CommandExecution.i18n.__(`command.${this.name}.error.punishmentActive.description`, {}));
        await CommandExecution.Guild.ModerationManager.deletePunishment(CommandExecution, CommandExecution.options.caseid, CommandExecution.options.reason);
        return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.punishmentRemoved.title`));
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.caseid = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.reason = CommandExecution.CommandOptions.join(' ');
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

        slashCommand.addNumberOption(option => 
            option.setName('caseid')
                .setDescription(i18n.__(`command.${this.name}.option.caseid.description`))
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
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`));

        tempEmbed.addField('caseid', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.caseid.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));
        tempEmbed.addField('reason', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.reason.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.string`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}