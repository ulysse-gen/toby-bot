const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "lastmessages",
    aliases: [],
    permission: "command.lastmessages",
    category: "moderation",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));

        let User = await CommandExecution.Guild.getMemberById(CommandExecution.options.target);
        if (typeof User == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));
        let UserPFP = await CommandExecution.Guild.getUserPfp(User);

        let logs = CommandExecution.Guild.MessageManager.getLastMessagesByUser(User.user.id);
        if (typeof logs == "undefined" || logs.length == 0)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noLogs.title`), CommandExecution.i18n.__(`command.${this.name}.error.noLogs.description`, {}));

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: CommandExecution.i18n.__(`command.${this.name}.embed.title`),
            color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
            description: CommandExecution.i18n.__(`command.${this.name}.embed.description`, {userId: User.user.id}),
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        logs.forEach(logEntry => {
            let FieldBody = CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody`, {content: logEntry.message.content, attachments: (logEntry.message.attachments.values.length == 0) ? `None` : `[**URL**](${logEntry.message.attachments.values.join(`) [**URL**](`)})`, stickers: (typeof logEntry.message.stickers.values == "undefined" || logEntry.message.stickers.values.length == 0) ? `None` : `[**URL**](${logEntry.message.stickers.values.join(`) [**URL**](`)})`, channelId: logEntry.channelId, timestamp: moment(logEntry.message.createdTimestamp).unix(), deleted: (logEntry.deleted) ? CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.deletedKeyword`) : '', edited: (logEntry.history.length != 0) ? CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.editedKeyword`) : '' });
            if (FieldBody.length > 1024){
                FieldBody = CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody`, {content: indMessage.content.trimEllip(1021-FieldBody.replace(indMessage.content, ``).length), attachments: (logEntry.message.attachments.values.length == 0) ? `None` : `[**URL**](${logEntry.message.attachments.values.join(`) [**URL**](`)})`, stickers: (typeof logEntry.message.stickers.values == "undefined" || logEntry.message.stickers.values.length == 0) ? `None` : `[**URL**](${logEntry.message.stickers.values.join(`) [**URL**](`)})`, channelId: logEntry.channelId, timeStamp: moment(logEntry.message.createdTimestamp).unix(), deleted: (logEntry.deleted) ? CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.deletedKeyword`) : '', edited: (logEntry.history.length != 0) ? CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.editedKeyword`) : '' });
            }
            embedFields.push([CommandExecution.i18n.__(`command.${this.name}.embed.fieldName`), FieldBody, false]);
        });

        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: CommandExecution.i18n.__(`command.${this.name}.searchThruPages`, {currentPage: 1, totalPages: embedPages.length})
        };

        embedFields = embedPages[0];
        if (CommandExecution.options.page) {
            try {
                CommandExecution.options.page = parseInt(CommandExecution.options.page);
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
        embed.addField(`**Infos**`, `UserID : ${User.user.id} • <t:${moment().unix()}>`, false);
        
        return CommandExecution.returnRaw({embeds: [embed]});
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length == 0)options.page = CommandExecution.CommandOptions.shift();
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addUserOption(option => 
            option.setName('target')
                .setDescription(i18n.__(`command.${this.name}.option.target.description`))
                .setRequired(true)
        );

        slashCommand.addIntegerOption(option => 
            option.setName('page')
                .setDescription(i18n.__(`command.${this.name}.option.page.description`))
                .setRequired(false)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('target', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.target.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));
        tempEmbed.addField('page', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.page.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.number`)}));

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