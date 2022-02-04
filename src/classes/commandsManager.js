//Import Node modules
const fs = require('fs');

//Import classes
const Command = require(`../classes/Command`);
const Logger = require(`../classes/Logger`);

module.exports = class commandsManager {
    constructor (client, commandsFolder = "/", permissionManager) {
        this.client = client;
        this.commandsFolder = commandsFolder;
        this.permissionManager = permissionManager;
        this.commands = [];

        this.initialize(commandsFolder);
    }

    initialize(commandsFolder) {
        //MainLog.log(`Initializing commandManager [${commandsFolder}]`, undefined, `file`);
        let zisse = this;
        fs.readdir(`./src/commands${commandsFolder}`, function (err, files) {
            if (err) {console.log(err);return false;}

            files.forEach(file => {
                if (file.split('.')[file.split('.').length - 1] != "js")return;
                let command = new Command(`${commandsFolder}${file}`);
                if (!zisse.checkForExistence(command))zisse.commands.push(command);
            });
          });
    }

    fetch(command) {
        for (const indCommand of this.commands) {
            if (typeof indCommand.status != "undefined" && indCommand.status == false)continue;
            if (indCommand.name == command)return indCommand;
            if (indCommand.aliases.includes(command))return indCommand;
        }
        return false;
    }

    checkForExistence(command) {
        for (const indCommand of this.commands) {
            if (indCommand.name == command.name)return true; //Same Name
            if (indCommand.aliases.includes(command.name))return true; //Name is already used as an alias on another command
            if (indCommand.aliases.some(r=> command.aliases.indexOf(r) >= 0))return true; //An alias is already used on another command
        }
        return false;
    }

    reload() {
        delete this.commands;
        this.commands = [];
        this.initialize(this.commandsFolder);
        return this;
    }
}