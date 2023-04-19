import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import prettyMilliseconds from "pretty-ms";
import CommandExecution from '../classes/CommandExecution';
import { I18n } from 'i18n';
import Command from '../classes/Command';

module.exports = {
    name: "about",
    aliases: ["infos","whoareyou"],
    permission: "command.about",
    category: "informations",
    enabled: true,
    async execute(CommandExecution: CommandExecution) {
        let fields = [
            [CommandExecution.i18n.__(`command.${this.name}.fields.developer.title`), CommandExecution.i18n.__(`command.${this.name}.fields.developer.content`), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.guildPrefix.title`), CommandExecution.i18n.__(`command.${this.name}.fields.guildPrefix.content`, {guildPrefix: CommandExecution.Guild.ConfigurationManager.get('prefix')}), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.globalPrefix.title`), CommandExecution.i18n.__(`command.${this.name}.fields.globalPrefix.content`, {globalPrefix: CommandExecution.TobyBot.ConfigurationManager.get('prefix')}), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.uptime.title`), prettyMilliseconds(CommandExecution.TobyBot.client.uptime), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.botVersion.title`), CommandExecution.TobyBot.PackageInformations.version, true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.nodeVersion.title`), process.version, true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.discordJsVersion.title`), CommandExecution.TobyBot.PackageInformations.dependencies["discord.js"], true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.latency.title`), CommandExecution.i18n.__(`command.${this.name}.fields.latency.content`, {latency: (Date.now() - CommandExecution.Trigger.createdTimestamp).toString()}), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.apiLatency.title`), CommandExecution.i18n.__(`command.${this.name}.fields.apiLatency.content`, {apiLatency: (Math.round(CommandExecution.TobyBot.client.ws.ping).toString())}), true]
        ];
        return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.title`), undefined, fields);
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        if (CommandExecution.CommandOptions.length == 0)return {};
        return {};
    },
    async optionsFromSlashOptions (CommandExecution: CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [(val as {name: string, value: string}).name, (val as {name: string, value: any}).value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n: I18n) {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));
    }
}