const Logger = require(`../classes/Logger`);

const MainLog = new Logger();

module.exports = class Command {
    constructor(command) {
        this.name = undefined;
        this.description = undefined;
        this.category = undefined;
        this.subcommands = undefined;
        this.aliases = undefined;
        this.permission = undefined;
        this.nestedPermissions = undefined;
        this.status = undefined;
        this.exec = undefined;
        this.init(command);
    }

    async init(command) {
        delete require.cache[require.resolve(`../commands${command}`)];
        let commandData = require(`../commands${command}`);
        if (typeof commandData.name != "string" || commandData.name == "") return returnWithError(`Could not init command, no name specified.`);
        if (typeof commandData.description != "string" || commandData.description == "") return returnWithError(`Could not init command ${commandData.name}, no description specified.`);
        if (typeof commandData.category != "string" || commandData.category == "") return returnWithError(`Could not init command ${commandData.name}, no category specified.`);
        //if (typeof commandData.subcommands != "object") logError(`No subcommands specified for the command ${commandData.name}`);
        if (typeof commandData.permission != "string" || commandData.permission == "") return returnWithError(`Could not init command ${commandData.name}, no premission specified.`);
        if (typeof commandData.exec != "function") return returnWithError(`Could not init command ${commandData.name}, no exec function specified.`);
        this.name = commandData.name;
        this.description = commandData.description;
        this.category = commandData.category;
        this.subcommands = (typeof commandData.subcommands == "object") ? commandData.subcommands : {};
        this.aliases = (typeof commandData.aliases == "object") ? commandData.aliases : [];
        this.permission = commandData.permission;
        this.nestedPermissions = (typeof commandData.nestedPermissions == "object") ? commandData.nestedPermissions : {};
        this.status = (typeof commandData.status == "boolean" || commandData.status != null) ? commandData.nestedPermissions : true;
        this.exec = commandData.exec;
        this.cooldown = (typeof commandData.cooldown == "number" || commandData.cooldown <= 0) ? commandData.cooldown : 0;
        this.globalCooldown = (typeof commandData.globalCooldown == "number" || commandData.globalCooldown <= 0) ? commandData.globalCooldown : 0;
    }
}

function returnWithError(error) {
    MainLog.log(`${error}`);
    return false;
}

function logError(error) {
    MainLog.log(`${error}`);
    return false;
}