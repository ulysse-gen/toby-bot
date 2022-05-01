const {
    MessageEmbed
} = require(`discord.js`);
const moment = require("moment");
const {
    configuration
} = require(`../../index`);
const urlExists = require('url-exists');

const utils = require(`../utils`);

module.exports = {
    name: "serverinformations",
    description: `Show information of a server.`,
    aliases: ["serverinfos", "serverinfo"],
    permission: `commands.serverinformations`,
    category: `informations`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let user = guild.guild.ownerId;

        user = await message.channel.guild.members.fetch(user, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        let userPFP = await utils.getUserPfp(user);

        let guildPFP = await new Promise((res, rej) => {
            let baseOfUrl = `https://cdn.discordapp.com/icons/${guild.guild.id}/${guild.guild.icon}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });

        let guildBanner = await new Promise((res, rej) => {
            let baseOfUrl = `https://cdn.discordapp.com/banners/${guild.guild.id}/${guild.guild.banner}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });

        let embed = new MessageEmbed({
            title: `${guild.guild.name}`,
            color: guild.configurationManager.configuration.colors.main,
            image: {
                url: `${guildBanner}?size=600`
            },
            author: {
                name: guild.guild.name,
                iconURL: `${guildPFP}?size=64`
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

        await guild.guild.members.fetch().then(fetchedMembers => {
            fetchedMembers.forEach(fetchedUser => {
                if (fetchedUser.user.bot) members.bots++;
                if (!fetchedUser.user.bot) members.users++;
            });
        });

        await guild.guild.channels.fetch().then(fetchedChannels => {
            fetchedChannels.forEach(fetchedChannel => {
                if (fetchedChannel.type == "GUILD_TEXT") channels.text++;
                if (fetchedChannel.type == "GUILD_VOICE") channels.voice++;
            });
        });

        await client.guilds.fetch(guild.guild.id).then(fetchedGuild => {
            emojis = fetchedGuild.emojis.cache.map(e => e.toString());
        }).catch(e => console.log(e));

        let BoostTier = `None`;
        if (guild.guild.premiumTier == "TIER_1")BoostTier = `1`;
        if (guild.guild.premiumTier == "TIER_2")BoostTier = `2`;
        if (guild.guild.premiumTier == "TIER_3")BoostTier = `3`;

        embed.addField(`**Owner**`, `<@${user.user.id}>(${user.user.id})`, true);
        embed.addField(`**Server ID**`, `${guild.guild.id}`, true);
        embed.addField(`**Description**`, `${(guild.guild.description != null) ? guild.guild.description : `No description set.`}`, false);
        embed.addField(`**Members (${members.users + members.bots})**`, `**${members.users}** users.\n**${members.bots}** bots.`, true);
        embed.addField(`**Channels (${channels.voice + channels.text})**`, `**${channels.text}** text.\n**${channels.voice}** voice.`, true);
        embed.addField(`**Created**`, `<t:${moment(guild.guild.createdTimestamp).unix()}>\n<t:${moment(guild.guild.createdTimestamp).unix()}:R>`, true);
        embed.addField(`**Roles**`, `**${await guild.guild.roles.fetch().then(fetchedRoles => fetchedRoles.size)}** roles.`, true);
        embed.addField(`**Boosts**`, `**${guild.guild.premiumSubscriptionCount}** boosters.\nLevel ${BoostTier}`, true);
        emojisParts = splitArrayIntoChunksOfLen(emojis, 25);
        let part = 0;
        emojisParts.forEach(remojisPart => {
            part++;
            embed.addField(`**Emojis ${(remojisPart.length > 1) ? `[Part ${part}/${emojisParts.length}]` : ``}(Total: ${(guild.guild.emojis.cache.size != 0) ? `${guild.guild.emojis.cache.size}` : `0`})**`, (guild.guild.emojis.cache.size != 0) ? `${remojisPart.join(' ')}` : `None`, (part == 1) ? false : true);
        });
        embed.addField(`**Infos**`, `ID: ${guild.guild.id} • <t:${moment().unix()}>`, false);

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
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