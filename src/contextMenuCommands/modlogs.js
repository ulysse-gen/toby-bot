const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "moderationlogs",
    displayName: "Show moderation logs",
    type: "USER",
    permission: "command.moderationlogs",
    enabled: true,
    async execute(ContextMenuCommandExecution) {
        let User = await ContextMenuContextMenuCommandExecution.Guild.getMemberById(ContextMenuContextMenuCommandExecution.Trigger.targetUser.id);
        let UserPFP = await ContextMenuCommandExecution.Guild.getUserPfp(User);

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: ContextMenuCommandExecution.i18n.__(`command.${this.name}.mainembed.title`),
            color: ContextMenuCommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        let makeTheStats = new Promise((res, rej) => {
            ContextMenuCommandExecution.Guild.SQLPool.query(`SELECT * FROM \`moderation\` WHERE \`userId\`='${User.user.id}' AND status!='deleted' AND \`guildId\`='${ContextMenuCommandExecution.Guild.guild.id}'`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool.`);
                    res(null);
                }
                if (results.length == 0) {
                    res(false);
                }
                let control = results.length;
                let sticky = undefined;
                results.reverse();
                results.forEach(modAction => {
                    if (modAction.type == "Sticky" && typeof sticky == "undefined") sticky = [`**:warning: Sticky Note :**`, `**User:** <@${User.user.id}>(${User.user.id})\n**Moderator:** <@${modAction.moderatorId}>(${modAction.moderatorId})\n**Reason:** ${modAction.reason}\n**Timestamp**: <t:${moment(modAction.timestamp).unix()}>${(JSON.parse(modAction.logs).length == 0) ? `` : `\n**Message history**: \`t!punishmenttranscript ${modAction.numId}\``}`, false];
                    if (modAction.type != "Sticky") {
                        if (!modAction.reason.startsWith('[RR Auto]')) embedFields.push([`**Case #${modAction.numId}**`, `**Type:** ${modAction.type}\n**User:** <@${User.user.id}>(${User.user.id})\n**Moderator:** <@${modAction.moderatorId}>(${modAction.moderatorId})\n**Reason:** ${modAction.reason}\n**Timestamp**: <t:${moment(modAction.timestamp).unix()}>${(modAction.type == "Mute" && modAction.status == "active") ? `\n**Expires:** <t:${moment(modAction.expires).unix()}>(<t:${moment(modAction.expires).unix()}:R>)` : ``}${(JSON.parse(modAction.logs).length == 0) ? `` : `\n**Message history**: \`t!punishmenttranscript ${modAction.numId}\``}`, false]);
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Ban" && modAction.status == "unbanned") embedFields[embedFields.length - 1][1] += `\n**Unbanned by:** <@${modAction.updaterId}>\n**Reason:** ${modAction.updateReason}\n**Timestamp**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Ban" && modAction.status == "expired") embedFields[embedFields.length - 1][1] += `\n**Auto unbanned by TobyBot**\n**Timestamp**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Mute" && modAction.status == "unmuted") embedFields[embedFields.length - 1][1] += `\n**Unmuted by:** <@${modAction.updaterId}>\n**Reason:** ${modAction.updateReason}\n**Timestamp**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                        if (!modAction.reason.startsWith('[RR Auto]') && modAction.type == "Mute" && modAction.status == "expired") embedFields[embedFields.length - 1][1] += `\n**Auto unmuted by TobyBot**: <t:${moment(modAction.updateTimestamp).unix()}>`;
                    }
                    control--;
                    if (control <= 0) {
                        if (typeof sticky != "undefined") embedFields.unshift(sticky);
                        res(true);
                    }
                });
                res(true);
            });
        });

        await makeTheStats;

        if (embedFields.length == 0) {
            embed.description = ContextMenuCommandExecution.i18n.__(`command.${this.name}.noLogs`);
            return ContextMenuCommandExecution.returnRaw({embeds: [embed]});
        }

        embedPages = splitArrayIntoChunksOfLen(embedFields, 10);
        embed.footer = {
            text: ContextMenuCommandExecution.i18n.__(`command.${this.name}.searchThruPages`, {currentPage: 1, totalPages: embedPages.length})
        };

        embedFields = embedPages[0];
        if (ContextMenuCommandExecution.options.page) {
            try {
                ContextMenuCommandExecution.options.page = parseInt(ContextMenuCommandExecution.options.page);
            } catch (e) {
                return ContextMenuCommandExecution.returnErrorEmbed({ephemeral: false}, ContextMenuCommandExecution.i18n.__(`command.generic.pageUseNumber`));
            }
            embed.footer = {
                text: ContextMenuCommandExecution.i18n.__(`command.${this.name}.searchThruPages`, {currentPage: ContextMenuCommandExecution.options.page, totalPages: embedPages.length})
            };
            if (typeof embedPages[ContextMenuCommandExecution.options.page - 1] == "undefined") return ContextMenuCommandExecution.returnErrorEmbed({ephemeral: false}, ContextMenuCommandExecution.i18n.__(`command.generic.pageDontExist`));
            embedFields = embedPages[ContextMenuCommandExecution.options.page - 1];
        }

        embedFields.forEach(embedField => {
            embed.addField(embedField[0], embedField[1], embedField[2]);
        });
        embed.addField(`**Infos**`, `UserID : ${User.user.id} • <t:${moment().unix()}>`, false);

        
        return ContextMenuCommandExecution.returnRaw({embeds: [embed]});
    },
    makeContextMenuCommand(i18n) {
        return new ContextMenuCommandBuilder().setName(this.name).setType((this.type == "CHAT_INPUT") ? 1 : (this.type == "USER") ? 2 : 3);
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