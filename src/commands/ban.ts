import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import timestring from 'timestring';
import CommandExecution from '../classes/CommandExecution';
import { I18n } from 'i18n';
import Command from '../classes/Command';

module.exports = {
    name: "ban",
    aliases: ["banuser", "banmember"],
    permission: "command.ban",
    category: "moderation",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution: CommandExecution) {
        if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
        if (typeof CommandExecution.options.reason == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.description`, {}));

        let Punished = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target);
        
        let PunishReason = CommandExecution.options.reason;
        let PunishDuration = true;
        if (typeof CommandExecution.options.duration != "undefined"){
            PunishReason = CommandExecution.options.reason;
            PunishDuration = CommandExecution.options.duration;
        }else {
            PunishReason = PunishReason.split(' ');
            try {
                PunishDuration = timestring(PunishReason[0])
                delete PunishReason[0];
                PunishReason = PunishReason.join(' ');
            } catch (e) {
                PunishReason = PunishReason.join(' ');
            }
        }
        let Punishment = (typeof Punished == "undefined") ? await CommandExecution.Guild.ModerationManager.banById(CommandExecution, CommandExecution.options.target, PunishReason, PunishDuration) : await CommandExecution.Guild.ModerationManager.banUser(CommandExecution, Punished, PunishReason, PunishDuration);
        return true;
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
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

        slashCommand.addStringOption(option => 
            option.setName('duration')
                .setDescription(i18n.__(`command.${this.name}.option.duration.description`))
                .setRequired(false)
        );

        return slashCommand;
    }
}