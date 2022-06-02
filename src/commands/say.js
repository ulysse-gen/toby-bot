const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "say",
    aliases: [],
    permission: "command.say",
    category: "fun",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.text != "string" || CommandExecution.options.text.replaceAll(' ', '') == "")throw {title: CommandExecution.i18n.__('commands.generic.error.title'), content: CommandExecution.i18n.__('command.say.error.textMustExistNotEmpty')};

        let channelToSendTo = (typeof CommandExecution.options.channel == "undefined") ? CommandExecution.channel : await CommandExecution.trigger.TobyBot.guild.getChannelById(CommandExecution.options.channel);

        channelToSendTo.send(CommandExecution.options.text);
        CommandExecution.trigger.delete();

        await CommandExecution.returnMainEmbed({ephemeral: true, slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.sent`));
        return true;
    },
    optionsFromArgs (args) {
        var options = {};
        options.text = args.join(' ');
        return options;
    },
    optionsFromSlashOptions (slashOptions) {
        var options = Object.fromEntries(Object.entries(slashOptions).map(([key, val]) => [val.name, val.value]));
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addStringOption(option => 
            option.setName('text')
                .setDescription(i18n.__(`command.${this.name}.option.text.description`))
                .setRequired(true)
        );

        slashCommand.addChannelOption(option => 
            option.setName('channel')
                .setDescription(i18n.__(`command.${this.name}.option.channel.description`))
                .setRequired(false)
        );

        return slashCommand;
    }
}