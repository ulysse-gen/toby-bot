//Import Node modules
const fs = require('fs');
const {
    Routes
} = require('discord-api-types/v9');

//Import classes
const Command = require(`../classes/Command`);
const Logger = require(`../classes/Logger`);

const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class commandsManager {
    constructor(client, commandsFolder = "/", permissionManager) {
        this.client = client; //Have the DiscordJS client imported for easy access to API calls
        this.commandsFolder = commandsFolder; //The folder where the commands are (starting from ./src/commands)
        this.commands = []; //The main commands array
        this.slashCommands = [];

        this.initialized = false; //Set the main initialized variable to false
        this.verbose = false; //To turn on console verbose

        this.cooldowns = {}; //Store the users cooldowns
        this.globalCooldowns = {}; //Store the global cooldowns

        this.rest = undefined;

        this.initialize(this.commandsFolder); //Initialize the command manager
    }

    async initialize(commandsFolder, rest = undefined) { //Main initializer, read the files in the folder and create Command ojbects
        if (typeof this.rest == "undefined") this.rest = rest;
        if (this.verbose) MainLog.log(`Initializing commandManager [${commandsFolder}]`, undefined, `file`);
        let zisse = this; //To be able to use "this" in embeded functions
        await new Promise((res, _rej) => {
            fs.readdir(`./src/commands${commandsFolder}`, function (err, files) { //Read the choosed folder in ./src/commands/
                if (err) { //If there is an error, kill the initializing and log it in console
                    MainLog.log(`Failed initializing the command manager, could not load the files.`, undefined, `file`);
                    return false;
                }
                let control = files.length;
                files.forEach(async file => { //For each files in the folder
                    control--;
                    if (file.split('.')[file.split('.').length - 1] == "js") { //If does not end with .js, skip it
                        let command = new Command(`${commandsFolder}${file}`); //Create the Command object
                        if (zisse.verbose && !zisse.checkForExistence(command)) MainLog.log(`Initialized command ${command.name}.`, undefined, `file`);
                        if (!zisse.checkForExistence(command)) {
                            zisse.commands.push(command); //Push it in the command manager commands array
                            let slashCommand = await command.makeSlashCommand();
                            if (typeof slashCommand != "boolean")zisse.slashCommands.push(slashCommand.toJSON())
                        }
                    }
                    if (control == 0) res(true);
                });
            });
        }).then(async () => {
            if (typeof rest != "undefined") {
                try {
                    await rest.put(
                        Routes.applicationCommands(zisse.client.user.id), {
                            body: zisse.slashCommands
                        },
                    );
                    /*await rest.put(
                        Routes.applicationGuildCommands(zisse.client.user.id, '933416930038136832'), {
                            body: zisse.slashCommands
                        },
                    );*/
                    MainLog.log(`Registered slash command.`)
                } catch (error) {
                    ErrorLog.log(`Could not register slash commands. [${error.toString()}]`);
                }
            }
        });
        this.initialized = true;
        return true;
    }

    fetch(command) { //Fetch function
        for (const indCommand of this.commands) {
            if (typeof indCommand.status != "undefined" && !indCommand.status) continue;
            if (indCommand.name == command) return indCommand;
            if (indCommand.aliases.includes(command)) return indCommand;
        }
        return false;
    }

    checkForExistence(command) { //Check if a command exists (command must be a Command object)
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name) return true; //Same Name
            if (indCommand.aliases.includes(command.name)) return true; //Name is already used as an alias on another command
            if (indCommand.aliases.some(r => command.aliases.indexOf(r) >= 0)) return true; //An alias is already used on another command
        }
        return false;
    }

    async reload() { //Reload commands 
        delete this.commands; //Delete the commands array
        this.commands = []; //Re create it empty
        await this.initialize(this.commandsFolder); //Initialize
        return this;
    }
}