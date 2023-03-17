const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "welcome",
    aliases: ["wlc","bienouquoi"],
    permission: "command.welcome",
    category: "fun",
    enabled: true,
    async execute(CommandExecution) {
        let fields = [
            [`**📌 First of all, go read**`, `<#892106114865438721>`, true],
            [`**📌 Make sure you get some**`, `<#907859717886447626>`, true],
            [`**📌 You can also get**`, `<#920163211074994186>`, true]
        ];
        let MentionUser = (!CommandExecution.IsSlashCommand && CommandExecution.Trigger.mentions.members.size != 0);
        return CommandExecution.sendEmbed((MentionUser) ? `Hi there ${CommandExecution.Trigger.mentions.members.first().user.username}#${CommandExecution.Trigger.mentions.members.first().user.discriminator} !` : `Hi there !`, `Welcome to ${CommandExecution.Guild.name}`, fields);
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