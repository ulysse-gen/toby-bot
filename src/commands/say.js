const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "say",
    permission: "command.say",
    category: "fun",
    enabled: true,
    async exec(CommandManager, ExecutionContext) {
        if (typeof ExecutionContext.options.text != "string")throw {title: ExecutionContext.i18n.__('Error'), content: ExecutionContext.i18n.__('commands.say.error.textMustBeString')};
        if (ExecutionContext.options.text == "")throw {title: ExecutionContext.i18n.__('Error'), content: ExecutionContext.i18n.__('commands.say.error.textCannotBeEmpty')};
        ExecutionContext.trigger.delete();

        let channelToSendTo = (typeof ExecutionContext.options.channel == "undefined") ? ExecutionContext.channel : await ExecutionContext.trigger.TobyBot.guild.getChannelById(ExecutionContext.options.channel);

        channelToSendTo.send(ExecutionContext.options.text);
        return ExecutionContext.trigger.reply({
            embeds: [new MessageEmbed().setTitle(ExecutionContext.i18n.__(`commands.${this.name}.sent`)).setColor(ExecutionContext.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'))],
            ephemeral: true,
            slashOnly: true
        });
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
            .setDescription(i18n.__(`commands.${this.name}.description`));

        slashCommand.addStringOption(option => 
            option.setName('text')
                .setDescription(i18n.__(`commands.${this.name}.option.text.description`))
                .setRequired(true)
        );

        slashCommand.addChannelOption(option => 
            option.setName('channel')
                .setDescription(i18n.__(`commands.${this.name}.option.channel.description`))
                .setRequired(false)
        );

        return slashCommand;
    }
}