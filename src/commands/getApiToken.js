const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");
const crypto = require("crypto");
const jwt    = require('jsonwebtoken');

module.exports = {
    name: "getapitoken",
    aliases: [],
    permission: "command.getapitoken",
    category: "api",
    enabled: true,
    async execute(CommandExecution) {
        if (!CommandExecution.IsSlashCommand)return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.onlyslash`), CommandExecution.i18n.__(`command.${this.name}.error.onlyslash`));

        CommandExecution.User.tempTokenIdentifier = crypto.randomBytes(8).toString('hex')

        const token = jwt.sign({
            tokenIdentifier: CommandExecution.User.tempTokenIdentifier,
            User: CommandExecution.User.tokenVersion()
        },
        CommandExecution.TobyBot.API.secret,
        {
            expiresIn: 2 * 60
        });


        let link = 'http://' + CommandExecution.TobyBot.ConfigurationManager.get('apiDomain') + `/v1/users/authByTempToken/764011827109298187/${token}`;

        return CommandExecution.returnSuccessEmbed({ephemeral: true}, CommandExecution.i18n.__(`command.${this.name}.mainembed.title`), CommandExecution.i18n.__(`command.${this.name}.mainembed.description`,{link: link}));
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
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        returnObject.embeds.push(tempEmbed) 
        return returnObject;
    }
}