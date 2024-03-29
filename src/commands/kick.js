const {
    MessageEmbed
} = require(`discord.js`);
const utils = require(`../utils`);

module.exports = {
    name: "kick",
    description: `Kick a member`,
    aliases: ["kickuser", "kickmember"],
    permission: `commands.kick`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `None yet`, false]);
            fields.push([`**Usage:**`, `${guild.configurationManager.configuration.prefix}${this.name} <user> [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configurationManager.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} DopeUsername#0420 Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configurationManager.configuration.prefix}${this.name}`, `${description}`, fields, (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }
        let userToKick = args.shift();
        let reason = args.join(' ');
        let result = await guild.kickUser(message, userToKick, reason);
        if (result.errored == true) return utils.sendError(message, guild, `Could not kick user`, `${result.reason}`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        return (!isSlashCommand) ? true : utils.sendSuccess(message, guild, `User kicked.`, undefined, undefined, {ephemeral: true});
    }
}