import CommandExecution from "../classes/CommandExecution";

import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import prettyMilliseconds from "pretty-ms";
import Command from "../classes/Command";
import { I18n } from "i18n";

module.exports = {
    name: "help",
    aliases: ["?"],
    permission: "command.help",
    category: "informations",
    enabled: true,
    async execute(CommandExecution: CommandExecution) {
        let Commands = CommandExecution.TobyBot.CommandManager.commands;
        if (!CommandExecution.options.searchkey) {
            let embed = new MessageEmbed({
                title: CommandExecution.i18n.__(`command.${this.name}.mainEmbed.title`),
                color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
                description: CommandExecution.i18n.__(`command.${this.name}.mainEmbed.description`, {amount: Commands.size.toString(), list: '`' + Commands.map(c => c.name).join('`, `') + '`'})
            });
    
            return CommandExecution.returnRaw({embeds: [embed]});
        }

        if (CommandExecution.options.searchkey.toLowerCase() == "category" || CommandExecution.options.category){
            if (!CommandExecution.options.category) {
                return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.notCategorySpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.notCategorySpecified.description`))
            }

            Commands = Commands.filter(c => c.category == CommandExecution.options.category.toLowerCase());

            if (Commands.size == 0){
                return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.noCommandInCategory.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCommandInCategory.description`))
            }
            let embed = new MessageEmbed({
                title: CommandExecution.i18n.__(`command.${this.name}.categoryEmbed.title`),
                color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
                description: CommandExecution.i18n.__(`command.${this.name}.categoryEmbed.description`, {amount: Commands.size.toString(), list: '`' + Commands.map(c => c.name).join('`, `') + '`'})
            });
    
            return CommandExecution.returnRaw({embeds: [embed]});
        }

        let FetchedCommand = CommandExecution.CommandManager.fetch(CommandExecution.options.searchkey.toLowerCase());

        if (!FetchedCommand) {
            return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.commandNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.commandNotFound.description`))
        }

        return FetchedCommand.sendHelp(CommandExecution.Channel).catch(e => {
            console.log(e)
            CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotGetHelp.title`), CommandExecution.i18n.__(`command.error.couldNotGetHelp.description`));
        });
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.searchkey = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.category = CommandExecution.CommandOptions.shift();
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
    }
}