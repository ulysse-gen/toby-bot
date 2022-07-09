/////////////////////////////////
//Command Manager
/////////////////////////////////


//Importing NodeJS Modules
const fs = require(`fs`);
const colors = require(`colors`);
const { I18n } = require('i18n');
const {
    Routes
} = require('discord-api-types/v9');

//Importing classes
const Command = require('./Command');
const CommandExecution = require('./CommandExecution');
const FileLogger = require('./FileLogger');
const { setLocale } = require('i18n');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = class Metric {
    constructor(TobyBot, commandsFolder = "/") {
        this.TobyBot = TobyBot;

        this.commandsFolder = commandsFolder; //The folder where the commands are (starting from ./src/commands)
        this.commands = []; //The main commands array
        this.slashCommands = []; //The main commands array

        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'src/locales/commands',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
            autoReload: true,
        });

        this.initialized = false; //Set the main initialized variable to false
        this.verbose = false; //To turn on console verbose
    }

    async initialize() {
        let _this = this;
        if (this.verbose) MainLog.log(`Initializing CommandManager [${this.commandsFolder}]`);
        if (this.TobyBot.TopConfigurationManager.get('API.only')) MainLog.warning(this.TobyBot.i18n.__('bot.APIOnly'));

        if (!this.TobyBot.TopConfigurationManager.get('API.only'))await new Promise((res, _rej) => {
            fs.readdir(`./src/commands${_this.commandsFolder}`, function (err, files) { //Read events folder
                if (err) throw err;
                files.forEach((file, index, array) => { //For each files in the folder
                    if (file.endsWith('.js')) { //Only proceed if extension is .js
                        let cmd = new Command(_this, require(`../commands${_this.commandsFolder}${file}`));
                        if (!_this.checkForExistence(cmd)) {
                            _this.commands.push(cmd);
                            _this.slashCommands.push(cmd.slashCommand.toJSON());
                        }
                    }
                    if (index === array.length -1) res();
                });
            });
        });
        this.initialized = true;
        return true;
    } 

    async pushSlashCommands() {
        try {
            /*await this.TobyBot.rest.put(
                Routes.applicationCommands(this.TobyBot.client.user.id), {
                    body: this.slashCommands
                },
            );*/
            await this.TobyBot.rest.put(
                Routes.applicationGuildCommands(this.TobyBot.client.user.id, '933416930038136832'), {
                    body: this.slashCommands
                },
            );
            MainLog.log(this.TobyBot.i18n.__('bot.slashCommandRegistered', {amount: this.slashCommands.length.toString().green}));
        } catch (error) {
            throw error;
        }
        return true;
    }

    fetch(command) {
        return this.commands.find(indCommand => (!(typeof indCommand.enabled == "boolean" && !indCommand.enabled) && (indCommand.name == command || (typeof indCommand.aliases == "object" && indCommand.aliases.includes(command)))) ? indCommand : undefined);
    }

    async handle(message) {
        if (this.TobyBot.TopConfigurationManager.get('API.only'))return true;
        let prefixUsed = [this.TobyBot.ConfigurationManager.get('prefixes'), message.TobyBot.guild.ConfigurationManager.get('prefixes'), message.TobyBot.guild.ConfigurationManager.get('prefix')].flat().filter((item, pos, self) => self.indexOf(item) == pos).find(e => message.content.startsWith(e));
        if (!prefixUsed)return undefined;
        let commandOptions=message.content.replace(/\s+/g, ' ').trim().split(' ');
        let command=commandOptions.shift().replace(prefixUsed, '');
        let fetchedCommand = await this.fetch(command);
        return new CommandExecution(message, fetchedCommand, commandOptions, this).execute().catch(e=>{throw e});
    }

    async handleSlash(interaction) {
        let fetchedCommand = await this.fetch(interaction.commandName);
        return new CommandExecution(interaction, fetchedCommand, interaction.options._hoistedOptions, this, true).execute();
    }

    checkForExistence(command) { //Check if a command exists (command must be a Command object)
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name) return true; //Same Name
            if (indCommand.aliases.includes(command.name)) return true; //Name is already used as an alias on another command
            if (indCommand.aliases.some(r => command.aliases.indexOf(r) >= 0)) return true; //An alias is already used on another command
        }
        return false;
    }

    async hasPermission(CommandExecution) {
        let globalPermissions = await CommandExecution.TobyBot.PermissionManager.userHasPermission(CommandExecution.Command.permission, CommandExecution.GuildExecutor, CommandExecution.Channel);
        let guildPermissions = await CommandExecution.Trigger.TobyBot.guild.PermissionManager.userHasPermission(CommandExecution.Command.permission, CommandExecution.GuildExecutor, CommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }

    async hasPermissionPerContext(CommandExecution, permission) {
        let globalPermissions = await CommandExecution.TobyBot.PermissionManager.userHasPermission(permission, CommandExecution.GuildExecutor, CommandExecution.Channel);
        let guildPermissions = await CommandExecution.Trigger.TobyBot.guild.PermissionManager.userHasPermission(permission, CommandExecution.GuildExecutor, CommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }
}