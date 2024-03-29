const {
    globalPermissions
} = require(`../../index`);
const timestring = require('timestring')
const utils = require(`../utils`);

module.exports = {
    name: "mute",
    description: `Mute a member`,
    aliases: ["muteuser", "mutemember"],
    permission: `commands.mute`,
    slashCommandData: {
        options: [
            {
                name: "target",
                description: "The user to mute",
                required: true,
                type: "USER"
            },
            {
                name: "time",
                description: "Time of the mute",
                required: false,
                choices: [
                    ["One hour", "1h"],
                    ["Three hours", "3h"],
                    ["One day", "1d"]
                ],
                type: "STRING"
            },
            {
                name: "reason",
                description: "Reason of the mute",
                required: false,
                type: "STRING"
            }
        ]
    },
    nestedPermissions: {
        setMuteRole: `commands.mute.setmuterole`
    },
    category: `moderation`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `${guild.configurationManager.configuration.prefix}${this.name} setMuteRole @Role`, false]);
            fields.push([`**Current mute role:**`, `${(typeof guild.configurationManager.configuration.moderation.muteRole == "string" && guild.configurationManager.configuration.moderation.muteRole != "none") ? `<@&${guild.configurationManager.configuration.moderation.muteRole}>` : `Not defined`}`, false]);
            fields.push([`**Usage:**`, `${guild.configurationManager.configuration.prefix}${this.name} <user> [time] [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configurationManager.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configurationManager.configuration.prefix}${this.name} DopeUsername#0420 30min Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configurationManager.configuration.prefix}${this.name}`, `${description}`, fields, (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }
        if (args[0].toLowerCase() == "setmuterole") {
            let permissionToCheck = this.nestedPermissions.setMuteRole;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;
            if (!hasPermission) return utils.insufficientPermissions(message, guild, permissionToCheck, true, 5000, 5000);
            if (message.mentions.roles.length == 0) return utils.sendError(message, guild, `Could not set mute role`, `No roles mentionned in your message.`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
            guild.configurationManager.set(`moderation.muteRole`, message.mentions.roles.first().id);
            return utils.sendMain(message, guild, `Mute role defined`, `Mute role defined to <@&${message.mentions.roles.first().id}>`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }
        if (typeof guild.configurationManager.configuration.moderation.muteRole != "string" || guild.configurationManager.configuration.moderation.muteRole == "none") return utils.sendError(message, guild, `Could not mute`, `You must define the mute role before being able to mute.\nUse \`${guild.configurationManager.configuration.prefix}${this.name} setMuteRole @Role\``, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/

        let userToMute = args.shift();
        let reason = '';
        let time = 0;
        try {
            time = timestring(args[0])
            args[0] = "";
            reason = args.join(' ');
        } catch {
            reason = args.join(' ');
        }
        let result = await guild.muteUser(message, userToMute, reason, time);
        if (result.errored) return utils.sendError(message, guild, `Could not mute user`, `${result.reason}`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        return (!isSlashCommand) ? true : utils.sendSuccess(message, guild, `User muted.`, undefined, undefined, {ephemeral: true});
    }
}