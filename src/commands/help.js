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
        if (!CommandExecution.CommandOptions.searchkey) {
            let embed = new MessageEmbed({
                title: CommandExecution.i18n.__(`command.${this.name}.mainEmbed.title`),
                color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
                description: CommandExecution.i18n.__(`command.${this.name}.mainEmbed.description`, {amount: CommandExecution.TobyBot.CommandManager.commands.length, list: '`' + CommandExecution.TobyBot.CommandManager.commands.map(c => c.name).join('`, `') + '`'})
            });
    
            return CommandExecution.returnRaw({embeds: [embed]});
        }

        let searchThings = {
            commands: CommandExecution.TobyBot.CommandManager.commands.map(c => c.name).join('`, `')
        }

        if (searchThings.commands.includes(CommandExecution.CommandOptions.searchkey.toLowerCase())){
            console.log(CommandExecution.TobyBot.CommandManager.commands.filter(c => c.name == CommandExecution.CommandOptions.searchkey.toLowerCase())[0])
        }
        
        CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.generic.unknownSubCommand.title`), CommandExecution.i18n.__(`command.generic.unknownSubCommand.description`, {command: this.name}));
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.searchkey = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.idkWhat = CommandExecution.CommandOptions.shift();
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

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        returnObject.embeds.push(tempEmbed) 
        return returnObject;
    }
}