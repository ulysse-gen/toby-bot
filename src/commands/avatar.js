const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "avatar",
    aliases: ["av"],
    permission: "command.avatar",
    category: "infos",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution) {
        let User = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target, CommandExecution.GuildExecutor);
        if (typeof User == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));
        if (typeof CommandExecution.options.public != "boolean") CommandExecution.options.public = (["1", "yes", "oui", "y", "o", "true"].includes(CommandExecution.options.public)) ? true : false;
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
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.public = CommandExecution.CommandOptions.shift();
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