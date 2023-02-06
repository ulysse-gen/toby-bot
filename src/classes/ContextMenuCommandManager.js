/////////////////////////////////
//ContextMenuCommand Manager
/////////////////////////////////


//Importing NodeJS Modules
const fs = require(`fs`);
const colors = require(`colors`);
const { I18n } = require('i18n');
const {
    Routes
} = require('discord-api-types/v9');

//Importing classes
const ContextMenuCommand = require('./ContextMenuCommand');
const FileLogger = require('./FileLogger');
const { ContextMenuInteraction } = require('discord.js');
const ContextMenuCommandExecution = require('./ContextMenuCommandExecution');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');
const LocaleLog = new FileLogger('locale.log');

module.exports = class ContextMenuCommandManager {
    constructor(TobyBot, commandsFolder = "/") {
        this.TobyBot = TobyBot;

        this.commandsFolder = commandsFolder; //The folder where the commands are (starting from ./src/commands)
        this.commands = []; //The main commands array
        this.contextMenuCommand = []; //The main commands array

        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/commands',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
            autoReload: true,
            missingKeyFn: (locale, value) => {
                LocaleLog.log('[Missing Locale][commands]' + value + ` in ` + locale);
                return value;
            },
        });

        this.initialized = false; //Set the main initialized variable to false
        this.verbose = false; //To turn on console verbose

        this.registerCommands = true;
    }

    async initialize() {
        let _this = this;
        if (this.verbose) MainLog.log(`Initializing ContextMenuCommandManager [${this.commandsFolder}]`);
        if (process.env.TOBYBOT_API_ONLY === "true") MainLog.warning(this.TobyBot.i18n.__('bot.APIOnly.context'));

        if (process.env.TOBYBOT_API_ONLY === "false")await new Promise((res, _rej) => {
            fs.readdir(`./src/contextMenuCommands${_this.commandsFolder}`, function (err, files) { //Read events folder
                if (err) throw err;
                files.forEach((file, index, array) => { //For each files in the folder
                    if (file.endsWith('.js')) { //Only proceed if extension is .js
                        let cmd = new ContextMenuCommand(_this, require(`/app/src/contextMenuCommands${_this.commandsFolder}${file}`));
                        if (!_this.checkForExistence(cmd)) {
                            _this.commands.push(cmd);
                            _this.contextMenuCommand.push(cmd.contextMenuCommand.toJSON());
                        }
                    }
                    if (index === array.length -1) res();
                });
            });
        });
        this.initialized = true;
        return true;
    } 

    async pushContextCommands() {
        if (!this.registerCommands){
            MainLog.log(this.TobyBot.i18n.__('bot.contextMenuCommandRegisterSkip'));
            return true;
        }
        if (!this.TobyBot.commandsToRegister)this.TobyBot.commandsToRegister = [];
        this.TobyBot.commandsToRegister = this.TobyBot.commandsToRegister.concat(this.contextMenuCommand);
        return true;
    }

    fetch(command) {
        return this.commands.find(indCommand => (!(typeof indCommand.enabled == "boolean" && !indCommand.enabled) && (indCommand.displayName == command)) ? indCommand : undefined);
    }

    async handleContextMenu(interaction) {
        let fetchedCommand = await this.fetch(interaction.commandName);
        return new ContextMenuCommandExecution(interaction, fetchedCommand, this).execute();
    }

    checkForExistence(command) { //Check if a command exists (command must be a Command object)
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name) return true; //Same Name
        }
        return false;
    }

    async hasPermission(ContextMenuCommandExecution) {
        let globalPermissions = await ContextMenuCommandExecution.TobyBot.PermissionManager.userHasPermission(ContextMenuCommandExecution.Command.permission, ContextMenuCommandExecution.GuildExecutor, ContextMenuCommandExecution.Channel);
        let guildPermissions = await ContextMenuCommandExecution.Trigger.TobyBot.guild.PermissionManager.userHasPermission(ContextMenuCommandExecution.Command.permission, ContextMenuCommandExecution.GuildExecutor, ContextMenuCommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }

    async hasPermissionPerContext(ContextMenuCommandExecution, permission) {
        let globalPermissions = await ContextMenuCommandExecution.TobyBot.PermissionManager.userHasPermission(permission, ContextMenuCommandExecution.GuildExecutor, ContextMenuCommandExecution.Channel);
        let guildPermissions = await ContextMenuCommandExecution.Trigger.TobyBot.guild.PermissionManager.userHasPermission(permission, ContextMenuCommandExecution.GuildExecutor, ContextMenuCommandExecution.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }
}