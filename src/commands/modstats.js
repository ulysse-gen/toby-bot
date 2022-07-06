const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "moderationstatistics",
    aliases: ["moderationstats", "modstats"],
    permission: "command.moderationstatistics",
    category: "moderation",
    enabled: true,
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
            let stats = {
                sevenDays: {
                    mutes: 0,
                    bans: 0,
                    kicks: 0,
                    warns: 0
                },
                thirtyDays: {
                    mutes: 0,
                    bans: 0,
                    kicks: 0,
                    warns: 0
                },
                allTime: {
                    mutes: 0,
                    bans: 0,
                    kicks: 0,
                    warns: 0
                }
            }

            CommandExecution.Guild.SQLPool.query(`SELECT * FROM \`moderation\` WHERE \`moderatorId\`='${User.user.id}' AND \`guildId\`='${CommandExecution.Guild.guild.id}'`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool.`);
                    res(stats);
                }
                if (results.length == 0) res(stats);
                let control = results.length;
                results.forEach(modAction => {
                    if (!modAction.reason.startsWith('[RR Auto]') && modAction.status != "deleted") {
                        if (modAction.type == "Mute") {
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.mutes++;
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.mutes++;
                            stats.allTime.mutes++;
                        }
                        if (modAction.type == "Ban") {
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.bans++;
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.bans++;
                            stats.allTime.bans++;
                        }
                        if (modAction.type == "Kick") {
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.kicks++;
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.kicks++;
                            stats.allTime.kicks++;
                        }
                        if (modAction.type == "Warn") {
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(7, 'days'))) stats.sevenDays.warns++;
                            if (!moment(moment(modAction.timestamp)).isBefore(moment().subtract(30, 'days'))) stats.thirtyDays.warns++;
                            stats.allTime.warns++;
                        }
                    }
                    control--;
                    if (control <= 0)res(stats);
                });
            });
        });

        let stats = await makeTheStats;

        embed.addField(`**Mutes (last 7 days):**`, `${stats.sevenDays.mutes}`, true);
        embed.addField(`**Mutes (last 30 days):**`, `${stats.thirtyDays.mutes}`, true);
        embed.addField(`**Mutes (all time):**`, `${stats.allTime.mutes}`, true);
        embed.addField(`**Bans (last 7 days):**`, `${stats.sevenDays.bans}`, true);
        embed.addField(`**Bans (last 30 days):**`, `${stats.thirtyDays.bans}`, true);
        embed.addField(`**Bans (all time):**`, `${stats.allTime.bans}`, true);
        embed.addField(`**Kicks (last 7 days):**`, `${stats.sevenDays.kicks}`, true);
        embed.addField(`**Kicks (last 30 days):**`, `${stats.thirtyDays.kicks}`, true);
        embed.addField(`**Kicks (all time):**`, `${stats.allTime.kicks}`, true);
        embed.addField(`**Warns (last 7 days):**`, `${stats.sevenDays.warns}`, true);
        embed.addField(`**Warns (last 30 days):**`, `${stats.thirtyDays.warns}`, true);
        embed.addField(`**Warns (all time):**`, `${stats.allTime.warns}`, true);
        embed.addField(`**Total (last 7 days):**`, `${stats.sevenDays.mutes + stats.sevenDays.bans + stats.sevenDays.kicks + stats.sevenDays.warns}`, true);
        embed.addField(`**Total (last 30 days):**`, `${stats.thirtyDays.mutes + stats.thirtyDays.bans + stats.thirtyDays.kicks + stats.thirtyDays.warns}`, true);
        embed.addField(`**Total (all time):**`, `${stats.allTime.mutes + stats.allTime.bans + stats.allTime.kicks + stats.allTime.warns}`, true);
        if (User.user.id == "280063634477154306") embed.addField(`**Important infos:**`, `Whatever the stats can be, Kilo is still a very bad mod.`, true); //Kilo
        if (User.user.id == "737886546182799401") embed.addField(`**Important infos:**`, `Wait hm.. I'm not a kitten.`, true); //Flair
        if (User.user.id == "899655742389358612") embed.addField(`**Important infos:**`, `huh?`, true); //Olle
        if (User.user.id == "762760262683459654") embed.addField(`**Important infos:**`, `I'm very indecisive so could you make one up for me?`, true); //Aiko
        if (User.user.id == "913934813524799490") embed.addField(`**Important infos:**`, `The original sebs badge creator.`, true); //Sebs
        if (User.user.id == "408726936286658561") embed.addField(`**Important infos:**`, `<:teddy_bear:945443955263303750>`, true); //Bassie
        if (User.user.id == "580943656232419329") embed.addField(`**Important infos:**`, `aaaaaaaaaaaaaaaaa`, true); //Ama
        embed.addField(`**Infos**`, `UserID : ${User.user.id} • <t:${moment().unix()}>`, false);

        
        return CommandExecution.returnRaw({embeds: [embed]});
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
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

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('target', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.target.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));
         
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