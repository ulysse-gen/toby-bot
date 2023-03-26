module.exports = class ContextMenuCommand {
    constructor(ContextMenuCommandManager, command) {
        this.TobyBot = ContextMenuCommandManager.TobyBot;
        this.ContextMenuCommandManager = ContextMenuCommandManager;

        this.name = command.name;
        this.displayName = command.displayName;
        this.type = command.type; 
        this.enabled = command.enabled;
        this.permission = command.permission;

        this.contextMenuCommand = command.makeContextMenuCommand(this.ContextMenuCommandManager.i18n);

        this.execute = command.execute;
    }

    apiVersion (){
        let apiVersion = {};
        apiVersion.title = this.title;
        apiVersion.description = this.description;
        apiVersion.name = this.name;
        apiVersion.displayName = this.displayName;
        apiVersion.type = this.aliases;
        apiVersion.enabled = this.enabled;
        apiVersion.permission = this.permission;
        return apiVersion;
    }
}