const {
    MessageEmbed
} = require(`discord.js`);

const {
    configuration,
    MainLog
} = require(`../../index`);
const timestring = require('timestring')
const utils = require(`../utils`);

module.exports = {
    name: "ban",
    description: `Ban a member`,
    aliases: ["banuser", "banmember"],
    permission: `commands.ban`,
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
            return utils.sendMain(message, guild, `Command: ${guild.configuration.prefix}${this.name}`, `${description}`, fields, true); /*Updated To New Utils*/
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