const {
    MessageEmbed
} = require(`discord.js`);

const {
    globalConfiguration,
    MainLog
} = require(`../../index`);
const timestring = require('timestring')
const utils = require(`../utils`);

module.exports = {
    name: "ban",
    description: `Ban a member`,
    aliases: ["banuser", "banmember"],
    usage: {
        main: `${this.name}`,
        args: [{
            description: "User",
            placeholder: ["@User","UserID","UserTag#0420"],
            type: "String",
            optionnal: false
        }]
    },
    permission: `commands.ban`,
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
            args[0] = "";
            reason = args.join(' ');
        } catch {
            reason = args.join(' ');
        }
        let result = await guild.banUser(message, userToBan, reason, time);
        if (result.errored == true) return utils.sendError(message, guild, `Could not ban user`, `${result.reason}`, [], true); /*Updated To New Utils*/
        return false;
    }
}