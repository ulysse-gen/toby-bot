const utils = require(`../utils`);

module.exports = {
    name: "warn",
    description: `Warn a member`,
    aliases: ["warnuser", "warnmember"],
    permission: `commands.warn`,
    nestedPermissions: {},
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Usage:**`, `${guild.configuration.prefix}${this.name} <user> [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configuration.prefix}${this.name} DopeUsername#0420 Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configuration.prefix}${this.name}`, `${description}`, fields, true); /*Updated To New Utils*/
        }
        let userToWarn = args.shift();
        let reason = args.join(' ');
        let time = 0;
        reason = args.join(' ');
        /*try {
            time = timestring(args[0])
            args[0] = "";
            reason = args.join(' ');
        } catch {
            reason = args.join(' ');
        }*/
        let result = await guild.warnUser(message, userToWarn, reason, time);
        if (result.errored == true) return utils.sendError(message, guild, `Could not warn user`, `${result.reason}`, [], true); /*Updated To New Utils*/
        return false;
    }
}