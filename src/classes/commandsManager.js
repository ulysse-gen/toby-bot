//Import Node modules
const fs = require('fs');

//Import classes
const Command = require(`../classes/Command`);
const Logger = require(`../classes/Logger`);

const MainLog = new Logger();

module.exports = class commandsManager {
    constructor(client, commandsFolder = "/", permissionManager) {
        this.client = client; //Have the DiscordJS client imported for easy access to API calls
        this.commandsFolder = commandsFolder;   //The folder where the commands are (starting from ./src/commands)
        this.commands = []; //The main commands array

        this.initialized = false;   //Set the main initialized variable to false
        this.verbose = false;   //To turn on console verbose

        this.cooldowns = {};    //Store the users cooldowns

        this.initialize(commandsFolder);    //Initialize the command manager
    }

    async initialize(commandsFolder) { //Main initializer, read the files in the folder and create Command ojbects
        if (this.verbose) MainLog.log(`Initializing commandManager [${commandsFolder}]`, undefined, `file`);
        let zisse = this; //To be able to use "this" in embeded functions
        fs.readdir(`./src/commands${commandsFolder}`, function (err, files) { //Read the choosed folder in ./src/commands/
            if (err) {  //If there is an error, kill the initializing and log it in console
                MainLog.log(`Failed initializing the command manager, could not load the files.`, undefined, `file`);
                return false;
            }

            files.forEach(file => { //For each files in the folder
                if (file.split('.')[file.split('.').length - 1] != "js") return; //If does not end with .js, skip it
                let command = new Command(`${commandsFolder}${file}`);  //Create the Command object
                if (zisse.verbose && !zisse.checkForExistence(command)) MainLog.log(`Initialized command ${command.name}.`, undefined, `file`);
                if (!zisse.checkForExistence(command)) zisse.commands.push(command);    //Push it in the command manager commands array
            });
        });
        this.initialized = true;
    }

    fetch(command) {    //Fetch function
        for (const indCommand of this.commands) {
            if (typeof indCommand.status != "undefined" && indCommand.status == false) continue;
            if (indCommand.name == command) return indCommand;
            if (indCommand.aliases.includes(command)) return indCommand;
        }
        return false;
    }

    checkForExistence(command) {    //Check if a command exists (command must be a Command object)
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name) return true; //Same Name
            if (indCommand.aliases.includes(command.name)) return true; //Name is already used as an alias on another command
            if (indCommand.aliases.some(r => command.aliases.indexOf(r) >= 0)) return true; //An alias is already used on another command
        }
        return false;
    }

    reload() {  //Reload commands 
        delete this.commands; //Delete the commands array
        this.commands = []; //Re create it empty
        this.initialize(this.commandsFolder);   //Initialize
        return this;
    }
}