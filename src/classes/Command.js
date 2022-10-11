const { ErrorBuilder } = require("./Errors");

module.exports = class Command {
    constructor(CommandManager, command) {
        this.CommandManager = CommandManager;

        this.title = this.CommandManager.i18n.__(`command.${command.name}.name`);
        this.description = this.CommandManager.i18n.__(`command.${command.name}.description`);

        this.name = command.name;
        this.aliases = command.aliases; 
        this.category = command.category;
        this.enabled = command.enabled;
        this.permission = command.permission;

        this.execute = command.execute;
        this.optionsFromArgs = command.optionsFromArgs;
        this.optionsFromSlashOptions = command.optionsFromSlashOptions;

        this.slashCommand = command.makeSlashCommand(this.CommandManager.i18n);
        this.sendHelp = async (channel) => channel.send(await command.makeHelpEmbed(this)).catch(e=>{throw new ErrorBuilder(`Could not send command help.`, {cause: e}).logError()});

        this.hasSlashCommand = (typeof command.hasSlashCommand == "boolean") ? command.hasSlashCommand : false;
    }

    apiVersion (){
        let apiVersion = {};
        apiVersion.title = this.title;
        apiVersion.description = this.description;
        apiVersion.name = this.name;
        apiVersion.aliases = this.aliases;
        apiVersion.category = this.category;
        apiVersion.enabled = this.enabled;
        apiVersion.permission = this.permission;
        apiVersion.options = this.slashCommand.options;
        return apiVersion;
    }
}