/////////////////////////////////
//Command Manager
/////////////////////////////////


//Importing NodeJS Modules
import fs from 'fs';
import { I18n } from 'i18n';

//Importing classes
import Command from './Command';
import CommandExecution from './CommandExecution';
import FileLogger from './FileLogger';
import TobyBot from './TobyBot';
import { CommandExecutionError, FatalError } from './Errors';
import { TobyBotCommandInteraction, TobyBotMessage } from '../interfaces/main';
import { GuildMember } from 'discord.js';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');
const LocaleLog = new FileLogger('locale.log');

export default class CommandManager {
    TobyBot: TobyBot;
    commandsFolder: string;
    commands: Command[];
    slashCommands: any[];
    i18n: I18n;
    initialized: boolean;
    verbose: boolean;
    registerCommands: boolean;
    constructor(TobyBot: TobyBot, commandsFolder = "/") {
        this.TobyBot = TobyBot;

        this.commandsFolder = commandsFolder; //The folder where the commands are (starting from ./src/commands)
        this.commands = []; //The main commands array
        this.slashCommands = []; //The main commands array

        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/commands',
            defaultLocale: 'en-US',
            autoReload: true,
            missingKeyFn: (locale, value) => {
                LocaleLog.log('[Missing Locale][commands]' + value + ` in ` + locale);
                return value;
            },
            objectNotation: true
        });

        this.initialized = false; //Set the main initialized variable to false
        this.verbose = false; //To turn on console verbose
        
        this.registerCommands = false;
    }

    async initialize() {
        let _this = this;
        if (this.verbose) MainLog.log(`Initializing CommandManager [${this.commandsFolder}]`);
        if (process.env.TOBYBOT_API_ONLY === "true") MainLog.warning(this.TobyBot.i18n.__('bot.APIOnly.normal'));

        if (process.env.TOBYBOT_API_ONLY === "false")await new Promise<void>((res, _rej) => {
            fs.readdir(`./src/commands${_this.commandsFolder}`, function (err, files) { //Read events folder
                if (err) throw new FatalError(`Could not load commands.`, {cause: err}).logError();
                files.forEach((file, index, array) => { //For each files in the folder
                    if (file.endsWith('.js')) { //Only proceed if extension is .js
                        let cmd = new Command(_this, require(`/app/src/commands${_this.commandsFolder}${file}`));
                        if (!_this.checkForExistence(cmd)) {
                            _this.commands.push(cmd);
                            if (typeof cmd.hasSlashCommand == "boolean" && cmd.hasSlashCommand)_this.slashCommands.push(cmd.slashCommand.toJSON());
                        }
                    }
                    if (index === array.length -1) res();
                });
            });
        });
        this.initialized = false;
        return true;
    } 

    async pushSlashCommands() {
        if (!this.registerCommands){
            MainLog.log(this.TobyBot.i18n.__('bot.slashCommandRegisterSkip'));
            return true;
        }
        if (!this.TobyBot.commandsToRegister)this.TobyBot.commandsToRegister = [];
        this.TobyBot.commandsToRegister = this.TobyBot.commandsToRegister.concat(this.slashCommands);
        return true;
    }

    async pushAllCommands() {
        if (!this.TobyBot.commandsToRegister)this.TobyBot.commandsToRegister = [];
        try {
            /*await this.TobyBot.rest.put(
                Routes.applicationCommands(this.TobyBot.client.user.id), {
                    body: this.TobyBot.commandsToRegister
                },
            );
            await this.TobyBot.rest.put(
                Routes.applicationGuildCommands(this.TobyBot.client.user.id, '719963783677870173'), {
                    body: this.TobyBot.commandsToRegister
                },
            );*/
            MainLog.log(this.TobyBot.i18n.__('bot.registeredCommands', {amount: this.TobyBot.commandsToRegister.length.toString().green}));
        } catch (error) {
            MainLog.log(this.TobyBot.i18n.__('bot.registeredCommands.error', {amount: this.TobyBot.commandsToRegister.length.toString().green, error: error.toString()}));
            return false;
        }
        return true;
    }

    fetch(command: string) {
        return this.commands.find(indCommand => (!(typeof indCommand.enabled == "boolean" && !indCommand.enabled) && (indCommand.name == command || (typeof indCommand.aliases == "object" && indCommand.aliases.includes(command)))) ? indCommand : undefined);
    }

    async handle(message: TobyBotMessage) {
        if (process.env.TOBYBOT_API_ONLY === "true")return true;
        let prefixUsed = [this.TobyBot.ConfigurationManager.get('prefixes'), this.TobyBot.ConfigurationManager.get('prefix'), message.TobyBot.Guild.ConfigurationManager.get('prefixes'), message.TobyBot.Guild.ConfigurationManager.get('prefix')].flat().filter((item, pos, self) => self.indexOf(item) == pos).find(e => message.content.startsWith(e));
        if (!prefixUsed)return undefined;
        let commandOptions=message.content.replace(/\s+/g, ' ').trim().split(' ');
        let command=commandOptions.shift().replace(prefixUsed, '');
        let fetchedCommand = await this.fetch(command);
        return new CommandExecution(message, fetchedCommand, commandOptions, this).execute().catch(e=>{
            //CommandExecution.Channel.send('An error occured executing the command. Reach <@231461358200291330> for help.'); //CommandExecution.Channel may not be defined at this point
            throw new CommandExecutionError(`Could not execute command.`, {cause: e, command: fetchedCommand}).logError();
        });
    }

    async handleSlash(interaction: TobyBotCommandInteraction) {
        let fetchedCommand = await this.fetch(interaction.commandName);
        return new CommandExecution(interaction, fetchedCommand, interaction.options/*._hoistedOptions*/, this, true).execute().catch(e=>{
            //CommandExecution.Channel.send('An error occured executing the command. Reach <@231461358200291330> for help.'); //CommandExecution.Channel may not be defined at this point
            throw new CommandExecutionError(`Could not execute command.`, {cause: e, command: fetchedCommand}).logError();
        });
    }

    checkForExistence(command) { //Check if a command exists (command must be a Command object)
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name) return true; //Same Name
            if (indCommand.aliases.includes(command.name)) return true; //Name is already used as an alias on another command
            if (indCommand.aliases.some(r => command.aliases.indexOf(r) >= 0)) return true; //An alias is already used on another command
        }
        return false;
    }

    async hasPermission(CommandExecution: CommandExecution) {
        let globalPermissions = await CommandExecution.TobyBot.PermissionManager.userHasPermission(CommandExecution.Command.permission, CommandExecution.GuildExecutor, CommandExecution.Channel);
        let guildPermissions = await CommandExecution.Trigger.TobyBot.Guild.PermissionManager.userHasPermission(CommandExecution.Command.permission, CommandExecution.GuildExecutor, CommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }

    async hasPermissionPerContext(CommandExecution: CommandExecution, permission: string) {
        let globalPermissions = await CommandExecution.TobyBot.PermissionManager.userHasPermission(permission, CommandExecution.GuildExecutor, CommandExecution.Channel);
        let guildPermissions = await CommandExecution.Trigger.TobyBot.Guild.PermissionManager.userHasPermission(permission, CommandExecution.GuildExecutor, CommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }

    async userHasPermissionPerContext(CommandExecution: CommandExecution, GuildUser: GuildMember, permission: string) {
        let globalPermissions = await CommandExecution.TobyBot.PermissionManager.userHasPermission(permission, GuildUser, CommandExecution.Channel);
        let guildPermissions = await CommandExecution.Trigger.TobyBot.Guild.PermissionManager.userHasPermission(permission, GuildUser, CommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }
}