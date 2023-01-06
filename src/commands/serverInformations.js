const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "serverinformations",
    aliases: ["serverinfos"],
    permission: "command.serverinformations",
    category: "infos",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution) {
        let Owner = await CommandExecution.Guild.getUserFromArg(CommandExecution.Guild.guild.ownerId);
        let OwnerPFP = await CommandExecution.Guild.getUserPfp(Owner);

        let GuildPFP = await CommandExecution.Guild.getGuildPfp();
        let GuildBanner = await CommandExecution.Guild.getGuildBanner();

        let embed = new MessageEmbed({
            title: CommandExecution.i18n.__(`command.${this.name}.embed.title`, {guildName: CommandExecution.Guild.guild.name}),
            color: CommandExecution.Guild.ConfigurationManager.get('style.colors.main'),
            image: {
                url: `${GuildBanner}?size=600`
            },
            thumbnail: {
                url: `${GuildPFP}?size=128`
            },
            author: {
                name: Owner.user.tag,
                iconURL: `${OwnerPFP}?size=64`
            }
        });

        let members = {
            users: 0,
            bots: 0
        }
        let channels = {
            voice: 0,
            text: 0
        }
        let emojis = [];
        let emojisParts = [];

        await CommandExecution.Guild.guild.members.fetch().then(fetchedMembers => {
            fetchedMembers.forEach(fetchedUser => {
                if (fetchedUser.user.bot) members.bots++;
                if (!fetchedUser.user.bot) members.users++;
            });
        });

        await CommandExecution.Guild.guild.channels.fetch().then(fetchedChannels => {
            fetchedChannels.forEach(fetchedChannel => {
                if (fetchedChannel.type == "GUILD_TEXT") channels.text++;
                if (fetchedChannel.type == "GUILD_VOICE") channels.voice++;
            });
        });

        await CommandExecution.TobyBot.client.guilds.fetch(CommandExecution.Guild.guild.id).then(fetchedGuild => {
            emojis = fetchedGuild.emojis.cache.map(e => e.toString());
        }).catch(e => {
            return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotGetEmojis.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotGetEmojis.description`));
        });

        let BoostTier = `None`;
        if (CommandExecution.Guild.guild.premiumTier.premiumTier == "TIER_1")BoostTier = `1`;
        if (CommandExecution.Guild.guild.premiumTier.premiumTier == "TIER_2")BoostTier = `2`;
        if (CommandExecution.Guild.guild.premiumTier.premiumTier == "TIER_3")BoostTier = `3`;

        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.owner.name`), `<@${Owner.user.id}>(${Owner.user.id})`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.serverId.name`), `${CommandExecution.Guild.guild.id}`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.description.name`), `${(CommandExecution.Guild.guild.description != null) ? CommandExecution.Guild.guild.description : `No description set.`}`, false);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.members.name`, {amount: members.users + members.bots}), `**${members.users}** users.\n**${members.bots}** bots.`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.channels.name`, {amount: channels.voice + channels.text}), `**${channels.text}** text.\n**${channels.voice}** voice.`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.created.name`), `<t:${moment(CommandExecution.Guild.guild.createdTimestamp).unix()}>\n<t:${moment(CommandExecution.Guild.guild.createdTimestamp).unix()}:R>`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.roles.name`), `**${await CommandExecution.Guild.guild.roles.fetch().then(fetchedRoles => fetchedRoles.size)}** roles.`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.boosts.name`), `**${CommandExecution.Guild.guild.premiumSubscriptionCount}** boosters.\nLevel ${BoostTier}`, true);

        emojisParts = splitArrayIntoChunksOfLen(emojis, 25);
        let part = 0;
        emojisParts.forEach(remojisPart => {
            part++;
            embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.emojis.name`, {part: part, totalPart:emojisParts.length, total: (CommandExecution.Guild.guild.emojis.cache.size != 0) ? `${CommandExecution.Guild.guild.emojis.cache.size}` : `0`}), (CommandExecution.Guild.guild.emojis.cache.size != 0) ? `${remojisPart.join(' ')}` : `None`, (part == 1) ? false : true);
        });
        embed.addField(`**Infos**`, `GuildID: ${CommandExecution.Guild.guild.id} • <t:${moment().unix()}>`, false);

        return CommandExecution.returnRaw({embeds: [embed]});
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
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

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`));

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