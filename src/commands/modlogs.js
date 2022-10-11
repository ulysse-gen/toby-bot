const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "moderationlogs",
    aliases: ["modlogs", "whattheydidwrong"],
    permission: "command.moderationlogs",
    category: "moderation",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
    
        let User = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target);
        if (typeof User == "undefined"){
            if (CommandExecution.options.target.length != 18 && !(CommandExecution.options.target == 21 && CommandExecution.options.target.startsWith('<@')))return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));
            User = {
                id: (CommandExecution.options.target.length != 18) ? CommandExecution.options.target : CommandExecution.options.target.replace('<@').slice(0 ,-1),
                user: {
                    id: (CommandExecution.options.target.length != 18) ? CommandExecution.options.target : CommandExecution.options.target.replace('<@').slice(0 ,-1),
                    tag: 'UnknownTag#XXXX'
                }
            }
        }
        let UserPFP = await CommandExecution.Guild.getUserPfp(User);

        let embedFields = [];
        let embedPages = [];
        let embed = new MessageEmbed({
            title: CommandExecution.i18n.__(`command.${this.name}.mainembed.title`),
            color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        let makeTheStats = new Promise((res, rej) => {
            CommandExecution.Guild.SQLPool.query(`SELECT * FROM \`moderation\` WHERE \`userId\`='${User.user.id}' AND status!='deleted' AND \`guildId\`='${CommandExecution.Guild.guild.id}'`, async (error, results) => {
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
            embed.description = CommandExecution.i18n.__(`command.${this.name}.noLogs`);
            return CommandExecution.returnRaw({embeds: [embed]});
        }

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
        if (CommandExecution.CommandOptions.length != 0)options.page = CommandExecution.CommandOptions.shift();
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