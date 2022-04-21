const {
    SlashCommandBuilder
} = require('@discordjs/builders');

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
        this.slashCommandData = undefined;
        this.slashCommand = undefined;
        this.init(command);
    }

    async init(command) {
        delete require.cache[require.resolve(`../commands${command}`)];
        let commandData = require(`../commands${command}`);
        if (typeof commandData.name != "string" || commandData.name == "") return returnWithError(`Could not init command, no name specified.`);
        if (typeof commandData.description != "string" || commandData.description == "") return returnWithError(`Could not init command ${commandData.name}, no description specified.`);
        if (typeof commandData.category != "string" || commandData.category == "") return returnWithError(`Could not init command ${commandData.name}, no category specified.`);
        if (typeof commandData.permission != "string" || commandData.permission == "") return returnWithError(`Could not init command ${commandData.name}, no premission specified.`);
        if (typeof commandData.exec != "function") return returnWithError(`Could not init command ${commandData.name}, no exec function specified.`);
        this.name = commandData.name;
        this.description = commandData.description;
        this.category = commandData.category;
        this.slashCommandData = (typeof commandData.slashCommandData == "object") ? commandData.slashCommandData : undefined;
        this.aliases = (typeof commandData.aliases == "object") ? commandData.aliases : [];
        this.permission = commandData.permission;
        this.nestedPermissions = (typeof commandData.nestedPermissions == "object") ? commandData.nestedPermissions : {};
        this.status = (typeof commandData.status == "boolean" || commandData.status != null) ? commandData.nestedPermissions : true;
        this.exec = commandData.exec;
        this.cooldown = (typeof commandData.cooldown == "number" || commandData.cooldown <= 0) ? commandData.cooldown : 0;
        this.globalCooldown = (typeof commandData.globalCooldown == "number" || commandData.globalCooldown <= 0) ? commandData.globalCooldown : 0;
    }

    async makeSlashCommand() {
        if (typeof this.slashCommandData == "undefined")return false;
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name.toLowerCase())
            .setDescription(this.description);

        if (typeof this.slashCommandData.options != "undefined") orderOptions(this.slashCommandData.options).forEach(option => this.addOption(slashCommand, option));
        return slashCommand;
    }

    addOption(commandToAddTo, optionData) {
        switch (optionData.type) {
            case "SUBCOMMAND":
                commandToAddTo.addSubcommand(subcommand => this.createSubcommand(subcommand, optionData));
                break;

            case "STRING":
                commandToAddTo.addStringOption(option => this.createOption(option, optionData));
                break;

            case "INTEGER":
                commandToAddTo.addIntegerOption(option => this.createOption(option, optionData));
                break;

            case "NUMBER":
                commandToAddTo.addNumberOption(option => this.createOption(option, optionData));
                break;

            case "BOOLEAN":
                commandToAddTo.addBooleanOption(option => this.createOption(option, optionData));
                break;

            case "USER":
                commandToAddTo.addUserOption(option => this.createOption(option, optionData));
                break;

            case "CHANNEL":
                commandToAddTo.addChannelOption(option => this.createOption(option, optionData));
                break;

            case "ROLE":
                commandToAddTo.addRoleOption(option => this.createOption(option, optionData));
                break;

            case "MENTIONABLE":
                commandToAddTo.addMentionableOption(option => this.createOption(option, optionData));
                break;

            default:
                break;
        }
    }

    createOption(option, optionData) {
        option.setName(optionData.name.toLowerCase())
            .setDescription(optionData.description)
            .setRequired(optionData.required);
        if (typeof optionData.choices != "undefined")optionData.choices.forEach(choice => option.addChoice(choice[0], choice[1]));
        return option;
    }
    
    createSubcommand(subcommand, subcommandData) {
        subcommand.setName(subcommandData.name.toLowerCase())
            .setDescription(subcommandData.description);
        if (typeof subcommandData.options != "undefined") orderOptions(subcommandData.options).forEach(option => this.addOption(subcommand, option));
        return subcommand;
    }
}

function orderOptions (options) {
    options.sort((a, b) => {
        let aResult = (typeof a.required == "boolean") ? (a.required) ? 1 : 2 : 0;
        let bResult = (typeof b.required == "boolean") ? (b.required) ? 1 : 2 : 0;
        return aResult - bResult;
    });
    return options
}



function returnWithError(error) {
    MainLog.log(`${error}`);
    return false;
}