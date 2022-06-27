const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "avatar",
    aliases: ["av"],
    permission: "command.avatar",
    category: "infos",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.user != "string" || CommandExecution.options.user.replaceAll(' ', '') == "")throw new Error(CommandExecution.i18n.__('command.avatar.error.userMustExistNotEmpty'));
        let user = await CommandExecution.guild.getMemberById(CommandExecution.options.user);
        if (typeof user == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {error: error}));
        console.log(user);
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.commandOptions.length == 0)return options;

        options.user = CommandExecution.commandOptions[0];
        if (options.user.startsWith('<@'))options.user = options.user.replace('<@', '').replace('>', '');
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        return Object.fromEntries(Object.entries(CommandExecution.commandOptions).map(([key, val]) => [val.name, val.value]));
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addUserOption(option => 
            option.setName('user')
                .setDescription(i18n.__(`command.${this.name}.option.user.description`))
                .setRequired(true)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('user', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.user.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}