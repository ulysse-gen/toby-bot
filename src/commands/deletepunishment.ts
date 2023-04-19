import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import CommandExecution from '../classes/CommandExecution';
import { Punishment } from '../interfaces/main';
import { I18n } from 'i18n';

module.exports = {
    name: "deletepunishment",
    aliases: ["deletepunish", "delpunish","deletewarn","delwarn","deletenote","delnote","deletesticky","delsticky"],
    permission: "command.deletepunishment",
    category: "moderation",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution: CommandExecution) {
        if (typeof CommandExecution.options.caseid == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noCaseIdSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCaseIdSpecified.description`, {}));
        if (typeof CommandExecution.options.reason == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.description`, {}));
    
        let Punishment = await CommandExecution.Guild.ModerationManager.getPunishementByCaseId(CommandExecution.options.caseid) as Punishment;
        if (typeof Punishment == "undefined" || Punishment.status == "deleted")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.punishmentNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.punishmentNotFound.description`));

        if (["Mute", "Ban"].includes(Punishment.type) && ["active", "indefinite"].includes(Punishment.status))return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.punishmentActive.title`), CommandExecution.i18n.__(`command.${this.name}.error.punishmentActive.description`, {}));
        await CommandExecution.Guild.ModerationManager.deletePunishment(CommandExecution, CommandExecution.options.caseid, CommandExecution.options.reason);
        return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.punishmentRemoved.title`));
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.caseid = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.reason = CommandExecution.CommandOptions.join(' ');
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
    }
}