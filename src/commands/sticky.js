const utils = require(`../utils`);

module.exports = {
    name: "sticky",
    description: `Note a member and pin it on top of modlogs. Like a warn but they dont get notified.`,
    aliases: ["stickynote", "pin"],
    permission: `commands.sticky`,
    nestedPermissions: {},
    category: `moderation`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Usage:**`, `${guild.configurationManager.configuration.prefix}${this.name} <user> [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configurationManager.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} DopeUsername#0420 Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configurationManager.configuration.prefix}${this.name}`, `${description}`, fields, (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }
        let userToSticky = args.shift();
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
        let result = await guild.stickyUser(message, userToSticky, reason, time);
        if (result.errored == true) return utils.sendError(message, guild, `Could not sticky note user`, `${result.reason}`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        return (!isSlashCommand) ? true : utils.sendSuccess(message, guild, `User sticky noted.`, undefined, undefined, {ephemeral: true});
    }
}