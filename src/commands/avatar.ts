import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import CommandExecution from '../classes/CommandExecution';
import { I18n } from 'i18n';
import Command from '../classes/Command';

module.exports = {
    name: "avatar",
    aliases: ["av"],
    permission: "command.avatar",
    category: "infos",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution: CommandExecution) {
        let User = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target, CommandExecution.GuildExecutor);
        if (typeof User == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));
        if (typeof CommandExecution.options.public != "boolean") CommandExecution.options.public = (["1", "yes", "oui", "y", "o", "true", "public", "main", "global"].includes(CommandExecution.options.public)) ? true : false;
        let UserPFP = await CommandExecution.Guild.getUserPfp(User, CommandExecution.options.public);

        let embed = new MessageEmbed({
            color: User.displayHexColor,
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            },
            image: {
                url: `${UserPFP}?size=4096`
            }
        });

        return CommandExecution.returnRaw({embeds: [embed]});
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.public = CommandExecution.CommandOptions.shift();
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
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
                .setRequired(false)
        );

        slashCommand.addBooleanOption(option => 
            option.setName('public')
                .setDescription(i18n.__(`command.${this.name}.option.public.description`))
                .setRequired(false)
        );

        return slashCommand;
    }
}