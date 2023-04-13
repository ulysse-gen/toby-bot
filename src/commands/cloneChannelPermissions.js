const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "clonechannelpermissions",
    aliases: ["ccp", "clonechannelpermission"],
    permission: "command.clonechannelpermissions",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.sourcechannel == "undefined" || CommandExecution.options.sourcechannel.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noSourceChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.noSourceChannel.description`, {}));
        if (typeof CommandExecution.options.receivechannel == "undefined" || CommandExecution.options.receivechannel.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReceiveChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReceiveChannel.description`, {}));

        const sourceChannel = await CommandExecution.Guild.getChannelFromArg(CommandExecution.options.sourcechannel);
        const receiveChannel = await CommandExecution.Guild.getChannelFromArg(CommandExecution.options.receivechannel);

        if (!sourceChannel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchSourceChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchSourceChannel.description`, {}));
        if (!receiveChannel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchReceiveChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchReceiveChannel.description`, {}));

        if (sourceChannel.id === receiveChannel.id)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.sourceAndReceiveSameChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.sourceAndReceiveSameChannel.description`, {}));

        await receiveChannel.permissionOverwrites.set(sourceChannel.permissionOverwrites.cache, CommandExecution.i18n.__(`command.${this.name}.reason`, {userTag: CommandExecution.RealUser.tag, userId: CommandExecution.RealUser.id}));

        return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.channelPermissionCloned.title`), CommandExecution.i18n.__(`command.${this.name}.channelPermissionCloned.description`));
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.sourcechannel = CommandExecution.CommandOptions.shift();
        options.receivechannel = CommandExecution.CommandOptions.shift();
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

            slashCommand.addStringOption(option => 
                option.setName('sourcechannel')
                    .setDescription(i18n.__(`command.${this.name}.option.${option.name}.description`))
                    .setRequired(true)
            );

            slashCommand.addStringOption(option => 
                option.setName('receivechannel')
                    .setDescription(i18n.__(`command.${this.name}.option.${option.name}.description`))
                    .setRequired(true)
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