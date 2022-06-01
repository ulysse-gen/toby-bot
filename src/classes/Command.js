module.exports = class Command {
    constructor(CommandManager, command) {
        this.CommandManager = CommandManager;

        this.title = this.CommandManager.i18n.__(`commands.${command.name}.name`);
        this.description = this.CommandManager.i18n.__(`commands.${command.name}.description`);

        this.name = command.name;
        this.category = command.category;
        this.enabled = command.enabled;

        this.exec = command.exec;
        this.optionsFromArgs = command.optionsFromArgs;
        this.optionsFromSlashOptions = command.optionsFromSlashOptions;

        this.slashCommand = command.makeSlashCommand(this.CommandManager.i18n);
    }

    async exec (CommandManager, ExecutionContext, message) {
        return this.exec(CommandManager, ExecutionContext, message);
    }
}