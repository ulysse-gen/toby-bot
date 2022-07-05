const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');
const FileConfigurationManager = require('../classes/FileConfigurationManager');

module.exports = {
    name: "globalconfiguration",
    aliases: ["globalconfig", "gconf"],
    permission: "command.globalconfiguration",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        let ConfigurationManager = CommandExecution.TobyBot.ConfigurationManager;
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/GlobalConfiguration.json');
        let ConfigurationFunctions = require('../../configurations/functions/GlobalConfiguration');
        await ConfigurationDocumentation.initialize();

        if (!ConfigurationManager.initialized)return CommandExecution.returnWarningEmbed({}, CommandExecution.i18n.__(`command.generic.configuration.first-init.title`), CommandExecution.i18n.__(`command.generic.configuration.first-init.description`, {}));

        if (CommandExecution.options.subCommand == "load"){
            await ConfigurationManager.load().catch(e => {
                CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.generic.configuration.cannotload.title`), CommandExecution.i18n.__(`command.generic.configuration.cannotload.description`, {}));
            });
            CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.loaded.title`), CommandExecution.i18n.__(`command.${this.name}.loaded.description`, {}));
            return true;
        }

        if (CommandExecution.options.subCommand == "save"){
            await ConfigurationManager.save().catch(e => {
                CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.generic.configuration.cannotsave.title`), CommandExecution.i18n.__(`command.generic.configuration.cannotsave.description`, {}));
            });
            CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.saved.title`), CommandExecution.i18n.__(`command.${this.name}.saved.description`, {}));
            return true;
        }

        if (CommandExecution.options.subCommand == "view"){
            if (typeof CommandExecution.options.key == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.description`, {}));
            
            let KeyDocumentation = ConfigurationDocumentation.get(CommandExecution.options.key);

            if (typeof KeyDocumentation != "object" || (typeof KeyDocumentation.editable != "boolean" || !KeyDocumentation.editable) || (typeof KeyDocumentation.name != "string" || typeof KeyDocumentation.description != "string" || typeof KeyDocumentation.type != "string"))return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.keyNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.keyNotFound.description`, {}));

            let KeyName = KeyDocumentation.name;
            let KeyDescription = KeyDocumentation.description;
            let KeyType = KeyDocumentation.type;
            let KeyDefaultValue  = KeyDocumentation.default;
            let KeyValue = ConfigurationManager.get(CommandExecution.options.key)

            if (["Object","Object(Array)"].includes(KeyType)){
                KeyValue = _.cloneDeep(KeyValue);
                KeyValue = JSON.stringify(KeyValue);
                KeyDefaultValue = JSON.stringify(KeyDefaultValue);
            }

            let fields = [
                [CommandExecution.i18n.__(`command.${this.name}.view.field.value.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.value.description`, { value: KeyValue }), true],
                [CommandExecution.i18n.__(`command.${this.name}.view.field.defaultvalue.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.defaultvalue.description`, { defaultValue: KeyDefaultValue }), true],
                [CommandExecution.i18n.__(`command.${this.name}.view.field.type.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.type.description`, { type: KeyType }), true],
                //[CommandExecution.i18n.__(`command.${this.name}.view.field.WebGUI.title`, {}), CommandExecution.i18n.__(`command.${this.name}.view.field.WebGUI.description`, { guildId: CommandExecution.guild.guild.id, key: CommandExecution.options.key }), true]
            ]

            CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.view.title`, { name: KeyName, key: CommandExecution.options.key }), CommandExecution.i18n.__(`command.${this.name}.view.description`, { description: KeyDescription }), fields);
            return true;
        }

        if (CommandExecution.options.subCommand == "reset"){
            if (typeof CommandExecution.options.key == "undefined")return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.description`, {}));
            
            let KeyDocumentation = ConfigurationDocumentation.get(CommandExecution.options.key);

            if (typeof KeyDocumentation != "object" || (typeof KeyDocumentation.editable != "boolean" || !KeyDocumentation.editable) || (typeof KeyDocumentation.name != "string" || typeof KeyDocumentation.description != "string" || typeof KeyDocumentation.type != "string"))return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.keyNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.keyNotFound.description`, {}));
            
            let KeyName = KeyDocumentation.name;
            let KeyDefaultValue  = KeyDocumentation.default;

            ConfigurationManager.set(CommandExecution.options.key, KeyDefaultValue);

            CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.reset.title`, { name: KeyName, key: CommandExecution.options.key }), CommandExecution.i18n.__(`command.${this.name}.reset.description`, { name: KeyName, key: CommandExecution.options.key }));
            return true;
        }

        if (CommandExecution.options.subCommand == "set"){
            if (typeof CommandExecution.options.key == "undefined")return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noKeySpecified.description`, {}));
            if (typeof CommandExecution.options.value == "undefined")return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noValueSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noValueSpecified.description`, {}));
            
            let KeyDocumentation = ConfigurationDocumentation.get(CommandExecution.options.key);

            if (typeof KeyDocumentation != "object" || (typeof KeyDocumentation.editable != "boolean" || !KeyDocumentation.editable) || (typeof KeyDocumentation.name != "string" || typeof KeyDocumentation.description != "string" || typeof KeyDocumentation.type != "string"))return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.keyNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.keyNotFound.description`, {}));
            
            let KeyName = KeyDocumentation.name;
            let KeyType = KeyDocumentation.type;
            let KeyDefaultValue  = KeyDocumentation.default;
            let KeyValue = ConfigurationManager.get(CommandExecution.options.key)

            let KeyNewValue = CommandExecution.options.value;

            if (KeyType.startsWith('String')){
                
            }else if (KeyType.startsWith('Object')){
                KeyValue = _.cloneDeep(KeyValue);
                try {
                    if (KeyNewValue.startsWith('+')) {
                        let KeyManipulating = _.cloneDeep(KeyValue);
                        KeyNewValue = KeyNewValue.replace('+', '')
                        if (KeyType == "Object(Array)"){
                            KeyManipulating.push(KeyNewValue);
                        }else if (KeyType == "Object") {
                            KeyManipulating[KeyNewValue.split(':', 2)[0]] = KeyNewValue.split(':', 2)[1];
                        }else {
                            KeyManipulating = KeyNewValue;
                        }
                        KeyNewValue = KeyManipulating;
                    }else if (KeyNewValue.startsWith('-')) {
                        let KeyManipulating = _.cloneDeep(KeyValue);
                        KeyNewValue = KeyNewValue.replace('-', '')
                        if (KeyType == "Object(Array)"){
                            KeyManipulating = KeyManipulating.filter(arrayItem => arrayItem !== KeyNewValue);
                        }else if (KeyType == "Object") {
                            delete KeyManipulating[KeyNewValue.split(':', 1)[0]];
                        }else {
                            KeyManipulating = KeyNewValue;
                        }
                        KeyNewValue = KeyManipulating;
                    } else {
                        KeyNewValue = JSON.parse(KeyNewValue);
                    }
                }catch (e) {
                    return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseJSON.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseJSON.description`, {error: e}));
                }
            }else if (["Integer"].includes(KeyType)){
                try {
                    KeyNewValue = parseInt(KeyNewValue);
                }catch (e) {
                    return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseInt.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseInt.description`, {error: e}));
                }
            }else if (["Float"].includes(KeyType)){
                try {
                    KeyNewValue = parseFloat(KeyNewValue);
                }catch (e) {
                    return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseFloat.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseFloat.description`, {error: e}));
                }
            }else if (["Boolean"].includes(KeyType)){
                if (["true","1","yes","y","oui","o"].includes(KeyNewValue)){
                    KeyNewValue = true;
                }else if (["false","0","no","n","non"].includes(KeyNewValue)) {
                    KeyNewValue = false;
                } else {
                    return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseBoolean.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseBoolean.description`, {}));
                }
            }else {
                return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.configCheckNotDefined.title`), CommandExecution.i18n.__(`command.${this.name}.error.configCheckNotDefined.description`, {}));
            }

            ConfigurationManager.set(CommandExecution.options.key, KeyNewValue);

            if (typeof _.get(ConfigurationFunctions, CommandExecution.options.key) == "function"){
                let updateFunction = await _.get(ConfigurationFunctions, CommandExecution.options.key)(CommandExecution.TobyBot, ConfigurationManager, CommandExecution.guild, CommandExecution);
                if (typeof updateFunction == "object") {
                    if (typeof updateFunction.status == "boolean" && updateFunction.status == false){
                        ConfigurationManager.set(CommandExecution.options.key, KeyValue);
                        return CommandExecution.replyErrorEmbed({ephemeral: null}, updateFunction.title, (typeof updateFunction.description == "string") ? updateFunction.description : undefined, (typeof updateFunction.fields == "object") ? updateFunction.fields : undefined);
                    }
                    if (typeof updateFunction.status == "object" && updateFunction.status == null)CommandExecution.replyWarningEmbed({ephemeral: null}, updateFunction.title, (typeof updateFunction.description == "string") ? updateFunction.description : undefined, (typeof updateFunction.fields == "object") ? updateFunction.fields : undefined);
                }
            }

            CommandExecution.returnSuccessEmbed({followUpIfReturned: true}, CommandExecution.i18n.__(`command.${this.name}.set.title`, { name: KeyName, key: CommandExecution.options.key }), CommandExecution.i18n.__(`command.${this.name}.set.description`, { name: KeyName, key: CommandExecution.options.key }));
            return true;
        }

        CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.generic.unknownSubCommand.title`), CommandExecution.i18n.__(`command.generic.unknownSubCommand.description`, {command: this.name}));
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
            subCommand.setName('help')
                .setDescription(i18n.__(`command.${this.name}.subcommand.help.description`))
        );

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
    async makeHelpEmbed(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription('**' + Command.CommandManager.i18n.__(`command.${this.name}.description`) + '**\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('help', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.help.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('load', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.load.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('save', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.save.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('set', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.set.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('view', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.view.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('reset', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.reset.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}