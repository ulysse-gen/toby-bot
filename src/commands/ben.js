const {
    MessageEmbed
} = require(`discord.js`);

const {
    globalConfiguration,
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
    usage: {
        main: `${this.name}`,
        args: [{
            description: "User",
            placeholder: ["@User","UserID","UserTag#0420"],
            type: "String",
            optionnal: false
        }]
    },
    permission: `commands.ben`,
    slashCommandData: {
        options: [
            {
                name: "target",
                description: "The user to ban",
                required: true,
                type: "USER"
            },
            {
                name: "time",
                description: "Time of the ban",
                required: false,
                choices: [
                    ["One hour", "1h"],
                    ["Three hours", "3h"],
                    ["One day", "1d"],
                    ["One year", "1y"]
                ],
                type: "STRING"
            },
            {
                name: "reason",
                description: "Reason of the ban",
                required: false,
                type: "STRING"
            }
        ]
    },
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `None yet`, false]);
            fields.push([`**Usage:**`, `${guild.configurationManager.configuration.prefix}${this.name} <user> [time] [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configurationManager.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} DopeUsername#0420 30min Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configurationManager.configuration.prefix}${this.name}`, `${description}`, fields, true); /*Updated To New Utils*/
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
        let userPFP = await utils.getUserPfp(user);
        let embed = new MessageEmbed({
            color: guild.configurationManager.configuration.colors.main,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            }
        });
        embed.addField(`**Case**`, `#69420`, true);
        embed.addField(`**Type**`, `Ben`, true);
        embed.addField(`**User**`, (typeof user != "undefined") ? `<@${user.user.id}>` : `${userToBan}`, true);
        embed.addField(`**Moderator**`, `<@${message.author.id}>`, true);
        embed.addField(`**Reason**`, `${(typeof reason == "string" && reason.replaceAll(" ", "") != "") ? reason : `No reason specified.`}`, true);
        embed.addField(`**Omg it looks like**`, `You cant spell`, true);
        embed.addField(`**Infos**`, `ID: ${user.user.id} • <t:${moment().unix()}>`, false);
        message.channel.send({ //Reply to the message that triggerred the error
            embeds: [embed],
            failIfNotExists: false //If the message deosent exists enymore, just send it without the reply
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        }).catch(e => ErrorLog.log(`An error occured in moderation manager. ${e.toString()}`));
        return false;
    }
}