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
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { Collection, GuildMember } from 'discord.js';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');
const LocaleLog = new FileLogger('locale.log');

export default class CommandManager {
    TobyBot: TobyBot;
    commandsFolder: string;
    commands: Collection<string, Command>;
    slashCommands: Collection<string, RESTPostAPIApplicationCommandsJSONBody>;
    i18n: I18n;
    initialized: boolean;
    verbose: boolean;
    registerCommands: boolean;
    constructor(TobyBot: TobyBot, commandsFolder = "/") {
        this.TobyBot = TobyBot;

        this.commandsFolder = commandsFolder; //The folder where the commands are (starting from ./src/commands)
        this.commands = new Collection<string, Command>; //The main commands array
        this.slashCommands = new Collection<string, RESTPostAPIApplicationCommandsJSONBody>; //The main commands array

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
                    if (file.endsWith('.js') || file.endsWith('.ts')) { //Only proceed if extension is .js or .ts
                        let cmd = require(`/app/src/commands${_this.commandsFolder}${file}`);
                        if (cmd.default)cmd = cmd.default;
                        const command = new Command(_this, cmd);
                        if (!_this.checkForExistence(cmd)) {
                            _this.commands.set(command.name, command);
                            if (command.slashCommand)_this.slashCommands.set(command.name, command.slashCommand.toJSON())
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

    fetch(command: string): Command {
        return this.commands.find((indCommand) => {
            if (typeof indCommand.enabled == "boolean" && !indCommand.enabled)return false;
            if (indCommand.name == command || (indCommand.aliases && Array.isArray(indCommand.aliases) && indCommand.aliases.includes(command)))return true;
        }) || undefined;
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
        const FoundCommand = this.fetch(command);
        return (FoundCommand instanceof Command) ? true : false;
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