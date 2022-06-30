const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const FileConfigurationManager = require('../classes/FileConfigurationManager');

module.exports = {
    name: "configuration",
    aliases: ["config", "conf"],
    permission: "command.configuration",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        let ConfigurationManager = CommandExecution.guild.ConfigurationManager;
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/GuildConfiguration.json');
        await ConfigurationDocumentation.initialize();


        if (CommandExecution.options.subCommand == "load"){
            await ConfigurationManager.load();
            CommandExecution.replyMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.loaded.title`), CommandExecution.i18n.__(`command.${this.name}.loaded.description`, {}));
            return true;
        }

        if (CommandExecution.options.subCommand == "save"){
            await ConfigurationManager.save();
            CommandExecution.replyMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.saved.title`), CommandExecution.i18n.__(`command.${this.name}.saved.description`, {}));
            return true;
        }

        if (CommandExecution.options.subCommand == "view"){
            if (typeof CommandExecution.options.key == "undefined")CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.description`, {}));
            let KeyDocumentation = ConfigurationDocumentation.get(CommandExecution.options.key);
            let KeyValue = ConfigurationManager.get(CommandExecution.options.key);
            let fields = [
                [CommandExecution.i18n.__(`command.${this.name}.view.field.value.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.value.description`, { value: KeyValue }), true],
                [CommandExecution.i18n.__(`command.${this.name}.view.field.defaultvalue.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.defaultvalue.description`, { defaultValue: KeyDocumentation.default }), true],
                [CommandExecution.i18n.__(`command.${this.name}.view.field.type.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.type.description`, { type: KeyDocumentation.type }), true]
            ]
            CommandExecution.replyMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.view.title`, { name: KeyDocumentation.name, key: CommandExecution.options.key }), CommandExecution.i18n.__(`command.${this.name}.view.description`, { description: KeyDocumentation.description }), fields);
            return true;
        }

        console.log(CommandExecution.options);
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.commandOptions.length == 0)return options;
        options.subCommand = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.key = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.value = CommandExecution.commandOptions.join(' ');
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.commandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.trigger.options._subcommand != "undefined" && CommandExecution.trigger.options._subcommand != null) options.subCommand = CommandExecution.trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addSubcommand(subCommand =>
            subCommand.setName('load')
                .setDescription(i18n.__(`command.${this.name}.subcommand.load.description`))
        );

        slashCommand.addSubcommand(subCommand =>
            subCommand.setName('save')
                .setDescription(i18n.__(`command.${this.name}.subcommand.save.description`))
        );

        slashCommand.addSubcommand(subCommand => {
            subCommand.setName('set')
                .setDescription(i18n.__(`command.${this.name}.subcommand.set.description`));

            subCommand.addStringOption(option => 
                option.setName('key')
                    .setDescription(i18n.__(`command.${this.name}.option.key.description`))
                    .setRequired(true)
            )

            subCommand.addStringOption(option => 
                option.setName('value')
                    .setDescription(i18n.__(`command.${this.name}.option.value.description`))
                    .setRequired(true)
            )

            return subCommand;
        });

        slashCommand.addSubcommand(subCommand => {
            subCommand.setName('view')
                .setDescription(i18n.__(`command.${this.name}.subcommand.view.description`));

            subCommand.addStringOption(option => 
                option.setName('key')
                    .setDescription(i18n.__(`command.${this.name}.option.key.description`))
                    .setRequired(true)
            )

            return subCommand;
        });

        slashCommand.addSubcommand(subCommand => {
            subCommand.setName('reset')
                .setDescription(i18n.__(`command.${this.name}.subcommand.reset.description`));

            subCommand.addStringOption(option => 
                option.setName('key')
                    .setDescription(i18n.__(`command.${this.name}.option.key.description`))
                    .setRequired(true)
            )

            return subCommand;
        });

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription('**' + Command.CommandManager.i18n.__(`command.${this.name}.description`) + '**\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('load', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.load.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('save', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.save.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('set', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.set.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('view', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.view.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('reset', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.reset.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}