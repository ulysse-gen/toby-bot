const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "say",
    aliases: [],
    description: "",
    permission: "command.say",
    category: "fun",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.toggle == "boolean"){
            if (typeof CommandExecution.guild.waitingForMessageData.say.channels[CommandExecution.channel.id] == "undefined")CommandExecution.guild.waitingForMessageData.say.channels[CommandExecution.channel.id] = {};
            if (typeof CommandExecution.guild.waitingForMessageData.say.channels[CommandExecution.channel.id][CommandExecution.executor.id] == "function"){
                delete CommandExecution.guild.waitingForMessageData.say.channels[CommandExecution.channel.id][CommandExecution.executor.id];
                await CommandExecution.returnMainEmbed({ephemeral: true}, CommandExecution.i18n.__(`command.${this.name}.toggled.off`));
                return true;
            }else {
                CommandExecution.guild.waitingForMessageData.say.channels[CommandExecution.channel.id][CommandExecution.executor.id] = async (message) => {
                    let channelToSendTo = (typeof CommandExecution.options.channel == "undefined") ? message.channel : await CommandExecution.trigger.TobyBot.guild.getChannelById(CommandExecution.options.channel);
                    channelToSendTo.send(message.content);
                    message.delete().catch(e => { throw e; });
                };
                await CommandExecution.returnMainEmbed({ephemeral: true}, CommandExecution.i18n.__(`command.${this.name}.toggled.on`));
                return true;
            }
        }

        if (typeof CommandExecution.options.text != "string" || CommandExecution.options.text.replaceAll(' ', '') == "")throw new Error(CommandExecution.i18n.__('command.say.error.textMustExistNotEmpty'));

        let channelToSendTo = (typeof CommandExecution.options.channel == "undefined") ? CommandExecution.channel : await CommandExecution.trigger.TobyBot.guild.getChannelById(CommandExecution.options.channel);

        channelToSendTo.send(CommandExecution.options.text);
        CommandExecution.trigger.delete().catch(e => { throw e; });

        await CommandExecution.returnMainEmbed({ephemeral: true, slashOnly: true}, CommandExecution.i18n.__(`command.${this.name}.sent`));
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.commandOptions.length == 0)return options;

        if (CommandExecution.commandOptions[0].startsWith('--channel:<#')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.channel`).catch(e => { throw e; }))return {permissionDenied: `${this.permission}.channel`};
            options.channel = CommandExecution.commandOptions[0].replace('--channel:<#', '').replace('>', '');
            CommandExecution.commandOptions = CommandExecution.commandOptions.filter(function(e) { return e !== CommandExecution.commandOptions[0]; });
        }

        if (CommandExecution.commandOptions[0].startsWith('-<#')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.channel`).catch(e => { throw e; }))return {permissionDenied: `${this.permission}.channel`};
            options.channel = CommandExecution.commandOptions[0].replace('-<#', '').replace('>', '');
            CommandExecution.commandOptions = CommandExecution.commandOptions.filter(function(e) { return e !== CommandExecution.commandOptions[0]; });
        }

        if (CommandExecution.commandOptions[0].startsWith('--toggle')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.toggle`).catch(e => { throw e; }))return {permissionDenied: `${this.permission}.toggle`};
            options.toggle = true;
            CommandExecution.commandOptions = CommandExecution.commandOptions.filter(function(e) { return e !== CommandExecution.commandOptions[0]; });
        }

        if (CommandExecution.commandOptions[0].startsWith('-t')){
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.toggle`).catch(e => { throw e; }))return {permissionDenied: `${this.permission}.toggle`};
            options.toggle = true;
            CommandExecution.commandOptions = CommandExecution.commandOptions.filter(function(e) { return e !== CommandExecution.commandOptions[0]; });
        }

        options.text = CommandExecution.commandOptions.join(' ');
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        let options = Object.fromEntries(Object.entries(CommandExecution.commandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof options.channel != "undefined")
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.channel`).catch(e => { throw e; }))return {permissionDenied: `${this.permission}.channel`};
        if (typeof options.toggle != "undefined")
            if (!await CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, `${this.permission}.toggle`).catch(e => { throw e; }))return {permissionDenied: `${this.permission}.toggle`};
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

                                            tempEmbed.addField('channel', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.channel.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.channel.id`)}));
        tempEmbed.addField('text', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.text.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.text`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}