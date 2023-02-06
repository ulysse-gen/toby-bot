const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "about",
    aliases: ["infos","whoareyou"],
    permission: "command.about",
    category: "informations",
    enabled: true,
    async execute(CommandExecution) {
        let fields = [
            [CommandExecution.i18n.__(`command.${this.name}.fields.developer.title`), CommandExecution.i18n.__(`command.${this.name}.fields.developer.content`), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.originalIdea.title`), CommandExecution.i18n.__(`command.${this.name}.fields.originalIdea.content`), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.dobiasTray.title`), CommandExecution.i18n.__(`command.${this.name}.fields.dobiasTray.content`), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.guildPrefix.title`), CommandExecution.i18n.__(`command.${this.name}.fields.guildPrefix.content`, {guildPrefix: CommandExecution.Guild.ConfigurationManager.get('prefix')}), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.globalPrefix.title`), CommandExecution.i18n.__(`command.${this.name}.fields.globalPrefix.content`, {globalPrefix: CommandExecution.TobyBot.ConfigurationManager.get('prefix')}), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.uptime.title`), prettyMilliseconds(CommandExecution.TobyBot.client.uptime), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.botVersion.title`), CommandExecution.TobyBot.PackageInformations.version, true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.nodeVersion.title`), process.version, true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.discordJsVersion.title`), CommandExecution.TobyBot.PackageInformations.dependencies["discord.js"], true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.latency.title`), CommandExecution.i18n.__(`command.${this.name}.fields.latency.content`, {latency: Date.now() - CommandExecution.Trigger.createdTimestamp}), true],
            [CommandExecution.i18n.__(`command.${this.name}.fields.apiLatency.title`), CommandExecution.i18n.__(`command.${this.name}.fields.apiLatency.content`, {apiLatency: Math.round(CommandExecution.TobyBot.client.ws.ping)}), true]
        ];
        return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.title`), undefined, fields);
    },
    async optionsFromArgs (CommandExecution) {
        if (CommandExecution.CommandOptions.length == 0)return {};
        return {};
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let optionTypes = {
            undefined: 'subcommand',
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
            HelpEmbed.addField(`${(option.options.required) ? '**[R]**' : '**[O]'}${option.name}**`, Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.${optionTypes[option.options.type]}.${option.name}.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.${optionTypes[option.options.type]}`)}));
        })

        returnObject.embeds.push(HelpEmbed) 
        return returnObject;
    }
}