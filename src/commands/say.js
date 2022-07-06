const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "say",
    aliases: [],
    permission: "command.say",
    category: "fun",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.toggle == "boolean"){
            if (typeof CommandExecution.Guild.waitingForMessageData.say.channels[CommandExecution.Channel.id] == "undefined")CommandExecution.Guild.waitingForMessageData.say.channels[CommandExecution.Channel.id] = {};
            if (typeof CommandExecution.Guild.waitingForMessageData.say.channels[CommandExecution.Channel.id][CommandExecution.Executor.id] == "function"){
                delete CommandExecution.Guild.waitingForMessageData.say.channels[CommandExecution.Channel.id][CommandExecution.Executor.id];
                await CommandExecution.returnSuccessEmbed({ephemeral: true}, CommandExecution.i18n.__(`command.${this.name}.toggled.off`));
                return true;
            }else {
                CommandExecution.Guild.waitingForMessageData.say.channels[CommandExecution.Channel.id][CommandExecution.Executor.id] = async (message) => {
                    let channelToSendTo = (typeof CommandExecution.options.channel == "undefined") ? message.channel : await CommandExecution.Trigger.TobyBot.guild.getChannelById(CommandExecution.options.channel);
                    channelToSendTo.send(message.content);
                    message.delete();
                };
                await CommandExecution.returnSuccessEmbed({ephemeral: true}, CommandExecution.i18n.__(`command.${this.name}.toggled.on`));
                return true;
            }
        }

        if (typeof CommandExecution.options.text != "string" || CommandExecution.options.text.replaceAll(' ', '') == "")throw new Error(CommandExecution.i18n.__('command.say.error.textMustExistNotEmpty'));

        let channelToSendTo = (typeof CommandExecution.options.channel == "undefined") ? CommandExecution.Channel : await CommandExecution.Trigger.TobyBot.guild.getChannelById(CommandExecution.options.channel);

        channelToSendTo.send(CommandExecution.options.text);
        CommandExecution.Trigger.delete();

        await CommandExecution.returnSuccessEmbed({ephemeral: true, slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.sent`));
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;

        if (CommandExecution.CommandOptions[0].startsWith('--channel:<#')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.channel`))return {permissionDenied: `${this.permission}.channel`};
            options.channel = CommandExecution.CommandOptions[0].replace('--channel:<#', '').replace('>', '');
            CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(function(e) { return e !== CommandExecution.CommandOptions[0]; });
        }

        if (CommandExecution.CommandOptions[0].startsWith('-<#')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.channel`))return {permissionDenied: `${this.permission}.channel`};
            options.channel = CommandExecution.CommandOptions[0].replace('-<#', '').replace('>', '');
            CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(function(e) { return e !== CommandExecution.CommandOptions[0]; });
        }

        if (CommandExecution.CommandOptions[0].startsWith('--toggle')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.toggle`))return {permissionDenied: `${this.permission}.toggle`};
            options.toggle = true;
            CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(function(e) { return e !== CommandExecution.CommandOptions[0]; });
        }

        if (CommandExecution.CommandOptions[0].startsWith('-t')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.toggle`))return {permissionDenied: `${this.permission}.toggle`};
            options.toggle = true;
            CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(function(e) { return e !== CommandExecution.CommandOptions[0]; });
        }

        options.text = CommandExecution.CommandOptions.join(' ');
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        let options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof options.channel != "undefined")
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.channel`))return {permissionDenied: `${this.permission}.channel`};
        if (typeof options.toggle != "undefined")
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.toggle`))return {permissionDenied: `${this.permission}.toggle`};
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

        slashCommand.addBooleanOption(option => 
            option.setName('toggle')
                .setDescription(i18n.__(`command.${this.name}.option.toggle.description`))
                .setRequired(false)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('toggle', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.toggle.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.boolean`)}));
        tempEmbed.addField('channel', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.channel.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.channel.id`)}));
        tempEmbed.addField('text', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.text.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.text`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}