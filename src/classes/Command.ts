import CommandManager from "./CommandManager";
import TobyBot from "./TobyBot";

import { MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

export default class Command {
    TobyBot: TobyBot;
    CommandManager: CommandManager;
    title: string;
    description: string;
    name: string;
    aliases: Array<string>;
    category: string;
    enabled: boolean;
    permission: string;
    permissions: Object;
    execute: any;
    optionsFromArgs: any;
    optionsFromSlashOptions: any;
    slashCommand: SlashCommandBuilder;
    sendHelp: (channel: any) => Promise<any>;
    constructor(CommandManager, command) {
        this.TobyBot = CommandManager.TobyBot;
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
                if ((option as any).options)(option as any).options.forEach(subOption => {
                    subOptionDescription += this.CommandManager.i18n.__(`commandsHelp.subArg.fieldTitle`, {name: subOption.name, required: (subOption.required) ? '[R]' : '[O]', description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${(option as any).name}.${subOption.name}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[subOption.type]}`)});
                    subOptionDescription += this.CommandManager.i18n.__(`commandsHelp.subArg.fieldDescription`, {name: subOption.name, required: (subOption.required) ? '[R]' : '[O]', description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${(option as any).name}.${subOption.name}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[subOption.type]}`)});
                })
                HelpEmbed.addField(this.CommandManager.i18n.__(`commandsHelp.arg.fieldTitle`, {name: (option as any).name, required: (!(option as any).type) ? '' : ((option as any).required) ? '[R]' : '[O]', description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${(option as any).name}.${optionTypes[(option as any).type]}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[(option as any).type]}`)}), this.CommandManager.i18n.__(`commandsHelp.arg.fieldDescription`, {description: this.CommandManager.i18n.__(`commandsHelp.command.${this.name}.${(option as any).name}.${optionTypes[(option as any).type]}.description`), type: this.CommandManager.i18n.__(`commandsHelp.generic.type.${optionTypes[(option as any).type]}`)}) + subOptionDescription)
            })
            return channel.send({embeds: [HelpEmbed]})
        };
    }

    apiVersion (){
        return {
            title: this.title,
            description: this.description,
            name: this.name,
            aliases: this.aliases,
            category: this.category,
            enabled: this.enabled,
            permission: this.permission,
            permissions: this.permissions,
            options: this.slashCommand.options
        };
    }
}