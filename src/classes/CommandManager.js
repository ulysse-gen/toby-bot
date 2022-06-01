/////////////////////////////////
//Command Manager
/////////////////////////////////


//Importing NodeJS Modules
const fs = require(`fs`);
const { I18n } = require('i18n');
const {
    Routes
} = require('discord-api-types/v9');

//Importing classes
const Command = require('./Command');
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
            locales: ['en-US'],
            directory: 'locales/commands',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US'
        });

        this.initialized = false; //Set the main initialized variable to false
        this.verbose = false; //To turn on console verbose
    }

    async initialize() {
        let _this = this;
        if (this.verbose) MainLog.log(`Initializing CommandManager [${this.commandsFolder}]`);
        await new Promise((res, _rej) => {
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
            MainLog.log(this.TobyBot.i18n.__('bot.slashCommandRegistered'));
        } catch (error) {
            ErrorLog.log(this.TobyBot.i18n.__('bot.slashCommandRegistered.error', {error: error.toString()}));
        }
        return true;
    }

    fetch(command) {
        return this.commands.find(indCommand => (!(typeof indCommand.enabled == "boolean" && !indCommand.enabled) && (indCommand.name == command || (typeof indCommand.aliases == "object" && indCommand.aliases.includes(command)))) ? indCommand : undefined);
    }

    async handle(trigger, prefix = undefined) {
        let command = undefined;
        let args = undefined;
        let slashOptions = undefined;
        if (typeof prefix != "undefined") {
            args = trigger.content.split(' ');
            command = args.shift().replace(prefix, '');
        }else {
            command = trigger.commandName;
            slashOptions = trigger.options._hoistedOptions;
        }

        var ExecutionContext = await this.ExecutionContextBuilder(command, trigger, args, slashOptions);
        if (typeof ExecutionContext == "undefined")throw 'Could not execute command.';

        MainLog.log(this.TobyBot.i18n.__((typeof ExecutionContext.spoofing != "undefined") ? 'bot.command.execution.spoofed' : 'bot.command.execution', {user: `${ExecutionContext.executor.username}#${ExecutionContext.executor.discriminator}(${ExecutionContext.executor.id})`, realUser: `${((typeof args == "undefined") ? ExecutionContext.trigger.user : ExecutionContext.trigger.author).username}#${((typeof args == "undefined") ? ExecutionContext.trigger.user : ExecutionContext.trigger.author).discriminator}(${((typeof args == "undefined") ? ExecutionContext.trigger.user : ExecutionContext.trigger.author).id})`, command: `${command}`, location: `${ExecutionContext.channel.id}@${ExecutionContext.channel.guild.id}`, realLocation: `${ExecutionContext.trigger.channel.id}@${ExecutionContext.trigger.channel.guild.id}`}));

        ExecutionContext.fetchedCommand.exec(this, ExecutionContext).catch(e =>{
            ErrorLog.error(`An error has been catched while executing the command:`);
            console.log(e)
;        });
        return true;
    }

    async ExecutionContextBuilder(command, trigger, args = undefined, slashOptions = undefined){
        let fetchedCommand = await this.fetch(command);
        if (typeof fetchedCommand == "undefined")return undefined;

        var ExecutionContext = {
            executor: (typeof args == "undefined") ? trigger.user : trigger.author,
            channel: trigger.channel,
            trigger: trigger,
            command: command,
            args: args,
            slashOptions: slashOptions,
            i18n: this.i18n,
            fetchedCommand: fetchedCommand
        };

        if (typeof args != "undefined") {
            ExecutionContext.trigger.replyOriginal = ExecutionContext.trigger.reply;
            ExecutionContext.trigger.reply = async (content) => {
                if (content.slashOnly)return true;
                return ExecutionContext.trigger.replyOriginal(content).then(message => {
                    if (content.ephemeral) setTimeout(()=>{
                        message.delete();
                    }, 5000);
                });
            }

            for (const arg of ExecutionContext.args) {
                if (arg.startsWith('--')){
                    let modifier = arg.replace('--', '').split("=");
                    let modifierName = modifier.shift();
                    let modifierValue = modifier.shift();
    
                    if (["spoofExecutor"].includes(modifierName)){
                        ExecutionContext.executor = (await ExecutionContext.trigger.TobyBot.guild.getMemberById(modifierValue)).user;
    
                        ExecutionContext.spoofing = true;
                        ExecutionContext.args = ExecutionContext.args.filter(function(e) { return e !== arg });
                    }
    
                    if (["spoofChannel"].includes(modifierName)){
                        ExecutionContext.channel = await ExecutionContext.trigger.TobyBot.guild.getChannelById(modifierValue);
    
                        ExecutionContext.spoofing = true;
                        ExecutionContext.args = ExecutionContext.args.filter(function(e) { return e !== arg; });
                    }
                }
            }
        }

        if (typeof args == "undefined") {
            ExecutionContext.trigger.delete = async () => true;
        }

        ExecutionContext.options = (typeof ExecutionContext.args != "undefined") ? ExecutionContext.fetchedCommand.optionsFromArgs(ExecutionContext.args) : ExecutionContext.fetchedCommand.optionsFromSlashOptions(ExecutionContext.slashOptions);

        return ExecutionContext;
    }

    checkForExistence(command) { //Check if a command exists (command must be a Command object)
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name) return true; //Same Name
            if (indCommand.aliases.includes(command.name)) return true; //Name is already used as an alias on another command
            if (indCommand.aliases.some(r => command.aliases.indexOf(r) >= 0)) return true; //An alias is already used on another command
        }
        return false;
    }
}