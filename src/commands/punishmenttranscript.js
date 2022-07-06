const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "punishmenttranscript",
    aliases: ["punishtranscript", "pt"],
    permission: "command.punishmenttranscript",
    category: "moderation",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.caseid == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noCaseIdSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noCaseIdSpecified.description`, {}));
    
        let Punishment = await CommandExecution.Guild.ModerationManager.getPunishementByCaseId(CommandExecution.options.caseid);
        if (typeof Punishment == "undefined" || Punishment.status == "deleted")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.punishmentNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.punishmentNotFound.description`, {}));
        
        let logs;
        try {
            logs = JSON.parse(Punishment.logs);
        } catch (e) {
            return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cannotParseLogs.title`), CommandExecution.i18n.__(`command.${this.name}.error.cannotParseLogs.description`, {}));
        }

        if (typeof logs == "undefined" || logs.length == 0)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noLogs.title`), CommandExecution.i18n.__(`command.${this.name}.error.noLogs.description`, {}));

        let User = await CommandExecution.Guild.getMemberById(Punishment.userId);
        let UserPFP = await CommandExecution.Guild.getUserPfp(User);

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: CommandExecution.i18n.__(`command.${this.name}.embed.title`),
            color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
            description: CommandExecution.i18n.__(`command.${this.name}.embed.description`, {userId: User.user.id, punishmentType: Punishment.type.toLowerCase()}),
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        logs.forEach(logEntry => {
            let FieldBody = CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody`, {content: logEntry.message.content, attachments: (logEntry.message.attachments.length == 0) ? `None` : `[**URL**](${logEntry.message.attachments.join(`) [**URL**](`)})`, stickers: (typeof logEntry.message.stickers == "undefined" || logEntry.message.stickers.length == 0) ? `None` : `[**URL**](${logEntry.message.stickers.join(`) [**URL**](`)})`, channelId: logEntry.channelId, timestamp: moment(logEntry.message.createdTimestamp).unix()});
            if (FieldBody.length > 1024){
                FieldBody = CommandExecution.i18n.__(`command.${this.name}.embed.fieldBody`, {content: indMessage.content.trimEllip(1021-FieldBody.replace(indMessage.content, ``).length), attachments: (logEntry.message.attachments.length == 0) ? `None` : `[**URL**](${logEntry.message.attachments.join(`) [**URL**](`)})`, stickers: (typeof logEntry.message.stickers == "undefined" || logEntry.message.stickers.length == 0) ? `None` : `[**URL**](${logEntry.message.stickers.join(`) [**URL**](`)})`, channelId: logEntry.channelId, timeStamp: moment(logEntry.message.createdTimestamp).unix()});
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
        options.caseid = CommandExecution.CommandOptions.shift();
        options.page = CommandExecution.CommandOptions.shift();
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

        slashCommand.addNumberOption(option => 
            option.setName('caseid')
                .setDescription(i18n.__(`command.${this.name}.option.caseid.description`))
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

        tempEmbed.addField('caseid', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.caseid.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.number`)}));
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