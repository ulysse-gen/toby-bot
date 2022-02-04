module.exports = class Command {
    constructor (command) {
        this.name;
        this.description;
        this.category;
        this.aliases;
        this.permission;
        this.nestedPermissions;
        this.status;
        this.exec;
        this.init(command);
    }

    init(command) {
        let commandData = require(`../commands${command}`);
        if (typeof commandData.description == "undefined" || commandData.description == "")return false;
        if (typeof commandData.name == "undefined" || commandData.name == "")return false;
        if (typeof commandData.exec == "undefined" || commandData.exec == "")return false;
        this.name = commandData.name;
        this.description = commandData.description;
        this.exec = commandData.exec;
        this.status = (typeof commandData.status == "boolean") ? commandData.status : true;
        this.category = (typeof commandData.category == "string") ? commandData.category : "unknown";
        if (typeof commandData.permission == "string")this.permission = commandData.permission;
        this.nestedPermissions = (typeof commandData.nestedPermissions == "object") ? commandData.nestedPermissions : {};
        this.aliases = (typeof commandData.aliases == "object") ? commandData.aliases : [];
        return;
    }
}