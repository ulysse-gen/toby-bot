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
    }

    async exec (CommandManager, ExecutionContext, message) {
        return this.exec(CommandManager, ExecutionContext, message);
    }
}