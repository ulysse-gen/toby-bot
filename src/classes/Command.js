const { ErrorBuilder } = require("./Errors");
const { MessageEmbed } = require('discord.js');

module.exports = class Command {
    constructor(CommandManager, command) {
        this.CommandManager = CommandManager;

        this.title = this.CommandManager.i18n.__(`command.${command.name}.name`);
        this.description = this.CommandManager.i18n.__(`command.${command.name}.description`);

        this.name = command.name;
        this.aliases = command.aliases; 
        this.category = command.category;
        this.enabled = command.enabled;
        this.permission = command.permission;
        this.permissions = (command.permissions) ? command.permissions : {};

        this.execute = command.execute;
        this.optionsFromArgs = command.optionsFromArgs;
        this.optionsFromSlashOptions = command.optionsFromSlashOptions;

        this.slashCommand = command.makeSlashCommand(this.CommandManager.i18n);
        this.sendHelp = async (channel) => {
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

            let HelpEmbed = new MessageEmbed().setTitle(this.CommandManager.i18n.__(`commandsHelp.title`, {name: this.name}))
            .setColor(await this.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
            .setDescription(this.CommandManager.i18n.__(`command.${this.name}.description`));

            this.slashCommand.options.forEach(option => {
                let subOptionDescription = ``;
                if (option.options)option.options.forEach(subOption => {
                    subOptionDescription += this.CommandManager.i18n.__(`commandsHelp.subArg.fieldTitle`, {name: subOption.name, required: (subOption.required) ? '[R]' : '[O]', description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${option.name}.${subOption.name}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[subOption.type]}`)});
                    subOptionDescription += this.CommandManager.i18n.__(`commandsHelp.subArg.fieldDescription`, {name: subOption.name, required: (subOption.required) ? '[R]' : '[O]', description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${option.name}.${subOption.name}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[subOption.type]}`)});
                })
                HelpEmbed.addField(this.CommandManager.i18n.__(`commandsHelp.arg.fieldTitle`, {name: option.name, required: (!option.type) ? '' : (option.required) ? '[R]' : '[O]', description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${option.name}.${optionTypes[option.type]}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[option.type]}`)}), this.CommandManager.i18n.__(`commandsHelp.arg.fieldDescription`, {description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${option.name}.${optionTypes[option.type]}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[option.type]}`)}) + subOptionDescription)
            })
            return channel.send({embeds: [HelpEmbed]})
        };

        this.hasSlashCommand = (typeof this.hasSlashCommand == "boolean") ? this.hasSlashCommand : false;
    }

    apiVersion (){
        let apiVersion = {};
        apiVersion.title = this.title;
        apiVersion.description = this.description;
        apiVersion.name = this.name;
        apiVersion.aliases = this.aliases;
        apiVersion.category = this.category;
        apiVersion.enabled = this.enabled;
        apiVersion.permission = this.permission;
        apiVersion.options = this.slashCommand.options;
        return apiVersion;
    }
}