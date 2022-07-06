const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const _ = require('lodash');
const FileConfigurationManager = require('../classes/FileConfigurationManager');

module.exports = {
    name: "globalpermission",
    aliases: ["gperms"],
    permission: "command.globalpermission",
    category: "administration",
    enabled: true,
    async execute(CommandExecution) {
        let PermissionManager = CommandExecution.TobyBot.PermissionManager;

        if (CommandExecution.options.subCommand == "load"){
            await PermissionManager.load().catch(e => {
                CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.generic.permission.cannotload.title`), CommandExecution.i18n.__(`command.generic.permission.cannotload.description`, {}));
            });
            CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.loaded.title`), CommandExecution.i18n.__(`command.${this.name}.loaded.description`, {}));
            return true;
        }

        if (CommandExecution.options.subCommand == "save"){
            await PermissionManager.save().catch(e => {
                CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.generic.permission.cannotsave.title`), CommandExecution.i18n.__(`command.generic.permission.cannotsave.description`, {}));
            });
            CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.saved.title`), CommandExecution.i18n.__(`command.${this.name}.saved.description`, {}));
            return true;
        }

        if (CommandExecution.options.subCommand == "help"){
            CommandExecution.returnWarningEmbed({}, CommandExecution.i18n.__(`command.${this.name}.help.title`), CommandExecution.i18n.__(`command.${this.name}.help.description`));
            return true;
        }

        if (CommandExecution.options.subCommand == "view"){
            if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
            
            let Target = await CommandExecution.guild.getMentionnableByArg(CommandExecution.options.target);
            if (typeof Target == "undefined" || Target == null)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetFound.description`, {}));
            let TargetType = (typeof Target.user == "undefined") ? 0 : 1;
            let TargetPermissions = {};

            switch (TargetType) {
                case 1:
                    TargetPermissions = await PermissionManager.getUserPermissions(Target.user.id, await Target.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true));
                    break;

                case 0:
                    TargetPermissions = await PermissionManager.getRolePermissions(Target.guild.id, Target.id, await Target.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true));
                    break;
            
                default:
                    break;
            }

            if (typeof CommandExecution.options.permission != "undefined" && !CommandExecution.options.permission.startsWith("page:")){
                if (typeof TargetPermissions[CommandExecution.options.permission] == "undefined")return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.view.unset.title`), CommandExecution.i18n.__(`command.${this.name}.view.unset.description`));
                let fields = [
                    [CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionKey.name`), CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionKey.content`, {permissionKey: CommandExecution.options.permission}), true],
                    [CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionValue.name`), CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionValue.content`, {permissionValue: (TargetPermissions[CommandExecution.options.permission].value) ? 'true' : 'false'}), true],
                    [CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionPriority.name`), CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionPriority.content`, {permissionPriority: TargetPermissions[CommandExecution.options.permission].priority}), true],
                    //[CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionTemporary.name`), CommandExecution.i18n.__(`command.${this.name}.view.single.field.permissionTemporary.content`, {permissionTemporary: (TargetPermissions[CommandExecution.options.permission].temporary) ? 'true' : 'false'}), true]
                ]
                return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.view.single.title`), undefined, fields);
            }

            let embedFields = [];
            let embedPages = [];
            let embed = new MessageEmbed({
                title: CommandExecution.i18n.__(`command.${this.name}.view.all.title`),
                description: CommandExecution.i18n.__(`command.${this.name}.view.all.description`, {targetName: (typeof Target.user == "undefined") ? Target.name : Target.user.tag}),
                color: CommandExecution.guild.ConfigurationManager.get('style.colors.main')
            });

            for (const individualPermission in TargetPermissions){
                embedFields.push([CommandExecution.i18n.__(`command.${this.name}.view.all.field.name`, {permissionKey: individualPermission}), CommandExecution.i18n.__(`command.${this.name}.view.all.field.description`, {permissionValue: (TargetPermissions[individualPermission].value) ? 'true' : 'false', permissionTemporary: (TargetPermissions[individualPermission].temporary) ? '*(TEMP)*' : '', permissionPriority: TargetPermissions[individualPermission].priority}), true])
            }

            embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
            embed.footer = {
                text: CommandExecution.i18n.__(`command.${this.name}.searchThruPages`, {currentPage: 1, totalPages: embedPages.length})
            };

            embedFields = embedPages[0];
            if (typeof CommandExecution.options.permission != "undefined" && CommandExecution.options.permission.startsWith("page:")) {
                try {
                    CommandExecution.options.page = parseInt(CommandExecution.options.permission.replace('page:', ''));
                } catch (e) {
                    return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.generic.pageUseNumber`));
                }
                embed.footer = {
                    text: CommandExecution.i18n.__(`command.${this.name}.searchThruPages`, {currentPage: CommandExecution.options.page, totalPages: embedPages.length})
                };
                if (typeof embedPages[CommandExecution.options.page - 1] == "undefined") return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.generic.pageDontExist`));
                embedFields = embedPages[CommandExecution.options.page - 1];
            }

            embedFields.forEach(embedField => {
                embed.addField(embedField[0], embedField[1], embedField[2]);
            });

            CommandExecution.returnRaw({embeds: [embed]});
            return true;
        }

        if (CommandExecution.options.subCommand == "set"){
            if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
            if (typeof CommandExecution.options.permission == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noPermissionSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noPermissionSpecified.description`, {}));
            if (typeof CommandExecution.options.value == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noValueSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noValueSpecified.description`, {}));
            
            if (typeof CommandExecution.options.value != "boolean")
            if (["true","1","yes","y","oui","o"].includes(CommandExecution.options.value)){
                CommandExecution.options.value = true;
            }else if (["false","0","no","n","non"].includes(CommandExecution.options.value)) {
                CommandExecution.options.value = false;
            } else {
                return CommandExecution.replyErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.valueNotBoolean.title`), CommandExecution.i18n.__(`command.${this.name}.error.valueNotBoolean.description`, {}));
            }

            if (typeof CommandExecution.options.priority != "undefined"){
                try {
                    CommandExecution.options.priority = parseInt(CommandExecution.options.priority);
                }catch (e) {
                    CommandExecution.options.priority = 0;
                    return CommandExecution.replyWarningEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseInt.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotParseInt.description`, {error: e}));
                }
            }

            let Target = await CommandExecution.guild.getMentionnableByArg(CommandExecution.options.target);
            if (typeof Target == "undefined" || Target == null)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetFound.description`, {}));
            let TargetType = (typeof Target.user == "undefined") ? 0 : 1;

            let Change = false;

            switch (TargetType) {
                case 1:
                    Change = await PermissionManager.setUserPermission(Target.user.id, CommandExecution.options.permission, CommandExecution.options.value, (typeof CommandExecution.options.priority == "number") ? CommandExecution.options.priority : undefined, undefined);
                    break;

                case 0:
                    Change = await PermissionManager.setRolePermission(Target.guild.id, Target.id, CommandExecution.options.permission, CommandExecution.options.value, (typeof CommandExecution.options.priority == "number") ? CommandExecution.options.priority : undefined, undefined);
                    break;
            
                default:
                    break;
            }

            if (!Change)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.set.fail.title`));
            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.set.title`));
        }

        if (CommandExecution.options.subCommand == "remove"){
            if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
            if (typeof CommandExecution.options.permission == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noPermissionSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noPermissionSpecified.description`, {}));
            

            let Target = await CommandExecution.guild.getMentionnableByArg(CommandExecution.options.target);
            if (typeof Target == "undefined" || Target == null)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetFound.description`, {}));
            let TargetType = (typeof Target.user == "undefined") ? 0 : 1;

            let Change = false;

            switch (TargetType) {
                case 1:
                    Change = await PermissionManager.deleteUserPermission(Target.user.id, CommandExecution.options.permission);
                    break;

                case 0:
                    Change = await PermissionManager.deleteRolePermission(Target.guild.id, Target.id, CommandExecution.options.permission);
                    break;
            
                default:
                    break;
            }

            if (!Change)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.remove.fail.title`));
            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.remove.title`));
        }

        CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.generic.unknownSubCommand.title`), CommandExecution.i18n.__(`command.generic.unknownSubCommand.description`, {command: this.name}));
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.commandOptions.length == 0)return options;
        options.subCommand = CommandExecution.commandOptions.shift();
        options.target = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.permission = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.value = CommandExecution.commandOptions.shift();
        if (CommandExecution.commandOptions.length != 0)options.priority = CommandExecution.commandOptions.shift();
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.commandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.trigger.options._subcommand != "undefined" && CommandExecution.trigger.options._subcommand != null) options.subCommand = CommandExecution.trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addSubcommand(subCommand =>
            subCommand.setName('help')
                .setDescription(i18n.__(`command.${this.name}.subcommand.help.description`))
        );

        slashCommand.addSubcommand(subCommand =>
            subCommand.setName('load')
                .setDescription(i18n.__(`command.${this.name}.subcommand.load.description`))
        );

        slashCommand.addSubcommand(subCommand =>
            subCommand.setName('save')
                .setDescription(i18n.__(`command.${this.name}.subcommand.save.description`))
        );

        slashCommand.addSubcommand(subCommand => {
            subCommand.setName('set')
                .setDescription(i18n.__(`command.${this.name}.subcommand.set.description`));

            subCommand.addMentionableOption(option => 
                option.setName('target')
                    .setDescription(i18n.__(`command.${this.name}.option.target.description`))
                    .setRequired(true)
            )

            subCommand.addStringOption(option => 
                option.setName('permission')
                    .setDescription(i18n.__(`command.${this.name}.option.permission.description`))
                    .setRequired(true)
            )

            subCommand.addBooleanOption(option => 
                option.setName('value')
                    .setDescription(i18n.__(`command.${this.name}.option.value.description`))
                    .setRequired(true)
            )

            subCommand.addNumberOption(option => 
                option.setName('priority')
                    .setDescription(i18n.__(`command.${this.name}.option.priority.description`))
                    .setRequired(false)
            )

            return subCommand;
        });

        slashCommand.addSubcommand(subCommand => {
            subCommand.setName('view')
                .setDescription(i18n.__(`command.${this.name}.subcommand.view.description`));

            subCommand.addMentionableOption(option => 
                option.setName('target')
                    .setDescription(i18n.__(`command.${this.name}.option.target.description`))
                    .setRequired(true)
            )

            subCommand.addStringOption(option => 
                option.setName('permission')
                    .setDescription(i18n.__(`command.${this.name}.option.permission.description`))
                    .setRequired(false)
            )

            return subCommand;
        });

        slashCommand.addSubcommand(subCommand => {
            subCommand.setName('remove')
                .setDescription(i18n.__(`command.${this.name}.subcommand.remove.description`));

            subCommand.addMentionableOption(option => 
                option.setName('target')
                    .setDescription(i18n.__(`command.${this.name}.option.target.description`))
                    .setRequired(true)
            )

            subCommand.addStringOption(option => 
                option.setName('permission')
                    .setDescription(i18n.__(`command.${this.name}.option.permission.description`))
                    .setRequired(true)
            )

            return subCommand;
        });

        return slashCommand;
    },
    async makeHelpEmbed(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription('**' + Command.CommandManager.i18n.__(`command.${this.name}.description`) + '**\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('help', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.help.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('load', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.load.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('save', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.save.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('set', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.set.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('view', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.view.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));
        tempEmbed.addField('remove', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.remove.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.subcommand`)}));

        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}

function splitArrayIntoChunksOfLen(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}