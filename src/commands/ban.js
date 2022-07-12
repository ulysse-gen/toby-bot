const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const timestring = require('timestring');

module.exports = {
    name: "ban",
    aliases: ["banuser", "banmember"],
    permission: "command.ban",
    category: "moderation",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
        if (typeof CommandExecution.options.reason == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReasonSpecified.description`, {}));

        let Punished = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target);
        
        let PunishReason = CommandExecution.options.reason;
        let PunishDuration = true;
        if (typeof CommandExecution.options.duration != "undefined"){
            PunishReason = CommandExecution.options.reason;
            PunishDuration = CommandExecution.options.duration;
        }else {
            PunishReason = PunishReason.split(' ');
            try {
                PunishDuration = timestring(PunishReason[0])
                delete PunishReason[0];
                PunishReason = PunishReason.join(' ');
            } catch (e) {
                PunishReason = PunishReason.join(' ');
            }
        }
        let Punishment = (typeof Punished == "undefined") ? await CommandExecution.Guild.ModerationManager.banById(CommandExecution, CommandExecution.options.target, PunishReason, PunishDuration) : await CommandExecution.Guild.ModerationManager.banUser(CommandExecution, Punished, PunishReason, PunishDuration);
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.reason = CommandExecution.CommandOptions.join(' ');
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
                .setRequired(true)
        );

        slashCommand.addStringOption(option => 
            option.setName('reason')
                .setDescription(i18n.__(`command.${this.name}.option.reason.description`))
                .setRequired(true)
        );

        slashCommand.addStringOption(option => 
            option.setName('duration')
                .setDescription(i18n.__(`command.${this.name}.option.duration.description`))
                .setRequired(false)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('target', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.target.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));
        tempEmbed.addField('duration', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.duration.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.duration`)}));
        tempEmbed.addField('reason', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.reason.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.string`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}