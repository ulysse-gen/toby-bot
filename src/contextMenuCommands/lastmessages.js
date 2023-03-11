const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "lastmessages",
    displayName: "Show last messages",
    type: "USER",
    permission: "command.lastmessages",
    enabled: true,
    async execute(ContextMenuCommandExecution) {
        let User = await ContextMenuCommandExecution.Guild.getMemberById(ContextMenuCommandExecution.Trigger.targetUser.id);
        let UserPFP = await ContextMenuCommandExecution.Guild.getUserPfp(User);

        let logs = ContextMenuCommandExecution.Guild.MessageManager.getLastMessagesByUser(User.User.id);
        if (typeof logs == "undefined" || logs.length == 0)return ContextMenuCommandExecution.returnErrorEmbed({}, ContextMenuCommandExecution.i18n.__(`command.${this.name}.error.noLogs.title`), ContextMenuCommandExecution.i18n.__(`command.${this.name}.error.noLogs.description`, {}));

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.title`),
            color: ContextMenuCommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
            description: ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.description`, {userId: User.User.id}),
            author: {
                name: User.User.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        logs.forEach(logEntry => {
            let FieldBody = ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldBody`, {content: logEntry.message.content, attachments: (logEntry.message.attachments.values.length == 0) ? `None` : `[**URL**](${logEntry.message.attachments.values.join(`) [**URL**](`)})`, stickers: (typeof logEntry.message.stickers.values == "undefined" || logEntry.message.stickers.values.length == 0) ? `None` : `[**URL**](${logEntry.message.stickers.values.join(`) [**URL**](`)})`, channelId: logEntry.channelId, timestamp: moment(logEntry.message.createdTimestamp).unix(), deleted: (logEntry.deleted) ? ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.deletedKeyword`) : '', edited: (logEntry.history.length != 0) ? ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.editedKeyword`) : '' });
            if (FieldBody.length > 1024){
                FieldBody = ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldBody`, {content: indMessage.content.trimEllip(1021-FieldBody.replace(indMessage.content, ``).length), attachments: (logEntry.message.attachments.values.length == 0) ? `None` : `[**URL**](${logEntry.message.attachments.values.join(`) [**URL**](`)})`, stickers: (typeof logEntry.message.stickers.values == "undefined" || logEntry.message.stickers.values.length == 0) ? `None` : `[**URL**](${logEntry.message.stickers.values.join(`) [**URL**](`)})`, channelId: logEntry.channelId, timeStamp: moment(logEntry.message.createdTimestamp).unix(), deleted: (logEntry.deleted) ? ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.deletedKeyword`) : '', edited: (logEntry.history.length != 0) ? ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldBody.editedKeyword`) : '' });
            }
            embedFields.push([ContextMenuCommandExecution.i18n.__(`command.${this.name}.embed.fieldName`), FieldBody, false]);
        });

        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: ContextMenuCommandExecution.i18n.__(`command.${this.name}.searchThruPages`, {currentPage: 1, totalPages: embedPages.length})
        };

        embedFields = embedPages[0];

        embedFields.forEach(embedField => {
            embed.addField(embedField[0], embedField[1], embedField[2]);
        });
        embed.addField(`**Infos**`, `UserID : ${User.User.id} • <t:${moment().unix()}>`, false);
        
        return ContextMenuCommandExecution.returnRaw({embeds: [embed]});
    },
    makeContextMenuCommand(i18n) {
        return new ContextMenuCommandBuilder().setName(this.displayName).setType((this.type == "CHAT_INPUT") ? 1 : (this.type == "USER") ? 2 : 3);
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