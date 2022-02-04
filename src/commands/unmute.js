const utils = require(`../utils`);

module.exports = {
    name: "unmute",
    description: `Unmute a member`,
    aliases: ["unmuteuser", "unmutemember"],
    permission: `commands.unmute`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `None yet`, false]);
            fields.push([`**Usage:**`, `${guild.configuration.prefix}${this.name} <userId> [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configuration.prefix}${this.name} 168754125874596348 We miss you`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configuration.prefix}${this.name}`, `${description}`, undefined, undefined, fields);
        }
        let userToUnban = args.shift();
        let reason = args.join(' ');
        let result = await guild.unmuteUser(message, userToUnban, reason);
        if (result.errored == true) return utils.sendError(message, guild, `Could not unmute user`, `${result.reason}`);
        utils.sendSuccess(message, guild, `User unmuted`);
        return true;
    }
}