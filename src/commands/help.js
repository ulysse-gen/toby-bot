const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "help",
    aliases: ["?"],
    permission: "command.help",
    category: "informations",
    enabled: true,
    async execute(CommandExecution) {
        let Commands = CommandExecution.TobyBot.CommandManager.commands;
        if (!CommandExecution.options.searchkey) {
            let embed = new MessageEmbed({
                title: CommandExecution.i18n.__(`command.${this.name}.mainEmbed.title`),
                color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
                description: CommandExecution.i18n.__(`command.${this.name}.mainEmbed.description`, {amount: Commands.length, list: '`' + Commands.map(c => c.name).join('`, `') + '`'})
            });
    
            return CommandExecution.returnRaw({embeds: [embed]});
        }

        if (CommandExecution.options.searchkey.toLowerCase() == "category" || CommandExecution.options.category){
            if (!CommandExecution.options.category) {
                return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.notCategorySpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.notCategorySpecified.description`))
            }

            Commands = Commands.filter(c => c.category == CommandExecution.options.category.toLowerCase());

            if (Commands.length == 0){
                return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.noCommandInCategory.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCommandInCategory.description`))
            }
            let embed = new MessageEmbed({
                title: CommandExecution.i18n.__(`command.${this.name}.categoryEmbed.title`),
                color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
                description: CommandExecution.i18n.__(`command.${this.name}.categoryEmbed.description`, {amount: Commands.length, list: '`' + Commands.map(c => c.name).join('`, `') + '`'})
            });
    
            return CommandExecution.returnRaw({embeds: [embed]});
        }

        let FetchedCommand = await CommandExecution.CommandManager.fetch(CommandExecution.options.searchkey.toLowerCase());

        if (!FetchedCommand) {
            return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.commandNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.commandNotFound.description`))
        }

        return FetchedCommand.sendHelp(CommandExecution.Channel).catch(e => {
            console.log(e)
            CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotGetHelp.title`), CommandExecution.i18n.__(`command.error.couldNotGetHelp.description`));
        });
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.searchkey = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.category = CommandExecution.CommandOptions.shift();
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
                option.setName('searchkey')
                    .setDescription(i18n.__(`command.${this.name}.option.searchkey.description`))
                    .setRequired(false)
            )

            slashCommand.addStringOption(option => 
                option.setName('category')
                    .setDescription(i18n.__(`command.${this.name}.option.category.description`))
                    .setRequired(false)
            )

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