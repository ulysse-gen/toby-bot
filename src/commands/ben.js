const {
    MessageEmbed
} = require(`discord.js`);

const {
    configuration,
    MainLog
} = require(`../../index`);
const timestring = require('timestring')
const urlExists = require('url-exists');
const moment = require('moment');
const utils = require(`../utils`);

module.exports = {
    name: "ben",
    description: `Ben a member`,
    aliases: ["benuser", "benmember"],
    permission: `commands.ben`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `None yet`, false]);
            fields.push([`**Usage:**`, `${guild.configuration.prefix}${this.name} <user> [time] [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configuration.prefix}${this.name} DopeUsername#0420 30min Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configuration.prefix}${this.name}`, `${description}`, undefined, undefined, fields);
        }
        let userToBan = args.shift();
        let reason = '';
        let time = 0;
        try {
            time = timestring(args[0])
            delete args[0];
            reason = args.join(' ');
        } catch {
            reason = args.join(' ');
        }
        let user = await guild.grabUser(message, userToBan);
        if (typeof user == "undefined") return {
            errored: true,
            reason: `User not found.`
        };
        let userPFP = await new Promise((res, rej) => {
            if (typeof user.user.avatar == "undefined")res(`https://tobybot.ubd.ovh/assets/imgs/default_discord_avatar.png`)
            let baseOfUrl = (user.avatar != null) ? `https://cdn.discordapp.com/avatars/${user.user.id}/${user.avatar}` : `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });
        let embed = new MessageEmbed({
            color: guild.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });
        embed.addField(`**Case**`, `#69420`, true);
        embed.addField(`**Type**`, `Ben`, true);
        embed.addField(`**User**`, `<@${user.user.id}>`, true);
        embed.addField(`**Moderator**`, `<@${message.author.id}>`, true);
        embed.addField(`**Reason**`, `${(typeof reason == "string" && reason.replaceAll(" ", "") != "") ? reason : `No reason specified.`}`, true);
        embed.addField(`**Omg it looks like**`, `You cant spell`, true);
        embed.addField(`**Infos**`, `ID: ${user.user.id} • <t:${moment().unix()}>`, false);
        message.channel.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        }).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        return false;
    }
}