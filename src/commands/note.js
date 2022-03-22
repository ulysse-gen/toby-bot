const utils = require(`../utils`);

module.exports = {
    name: "note",
    description: `Note a member. Like a warn but they dont get notified.`,
    aliases: ["notemember", "noteuser", "swarn"],
    permission: `commands.note`,
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
        let result = await guild.noteUser(message, userToWarn, reason, time);
        if (result.errored == true) return utils.sendError(message, guild, `Could not note user`, `${result.reason}`, [], true); /*Updated To New Utils*/
        return false;
    }
}