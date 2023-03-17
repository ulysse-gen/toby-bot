const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require("axios");

module.exports = {
    name: "hi",
    aliases: ["coucou"],
    permission: "command.hi",
    category: "fun",
    enabled: true,
    async execute(CommandExecution) {
        let possibilities = await axios.get('https://g.tenor.com/v1/search?q=hi%20anime&key=LIVDSRZULELA&limit=15').then(data => {
            return data.data.results.map(data => {
                if (!data.itemurl.includes("double") && !data.itemurl.includes("nigg")) return data.url;
            });
        }).catch(error => {
            return [];
        });

        if (possibilities.length <= 0)return CommandExecution.returnErrorEmbed({ephemeral: true}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchGifs.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchGifs.description`, {}));

        let MessageToSend = `<@${CommandExecution.Executor.id}> says hi! ${possibilities[Math.floor(Math.random()*possibilities.length)]}`;;
        if (!CommandExecution.IsSlashCommand && CommandExecution.Trigger.mentions.members.size != 0) MessageToSend = `<@${CommandExecution.Executor.id}> says hi to <@${CommandExecution.Trigger.mentions.members.first().user.id}> ${possibilities[Math.floor(Math.random()*possibilities.length)]}`;

        return CommandExecution.sendRaw(MessageToSend);
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