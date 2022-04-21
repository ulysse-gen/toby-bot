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
    name: "unban",
    description: `Unban a member`,
    aliases: ["unbanuser", "unbanmember", "pardon", "pardonuser", "pardonmember"],
    permission: `commands.unban`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `None yet`, false]);
            fields.push([`**Usage:**`, `${guild.configurationManager.configuration.prefix}${this.name} <userId> [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configurationManager.configuration.prefix}${this.name} 168754125874596348 We miss you`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configurationManager.configuration.prefix}${this.name}`, `${description}`, fields, true); /*Updated To New Utils*/
        }
        let userToUnban = args.shift();
        let reason = args.join(' ');
        let result = await guild.unbanUser(message, userToUnban, reason);
        if (result.errored == true) return utils.sendError(message, guild, `Could not unban user`, `${result.reason}`, [], true); /*Updated To New Utils*/
        utils.sendSuccess(message, guild, `User unbanned`, undefined, [], true); /*Updated To New Utils*/
        return true;
    }
}