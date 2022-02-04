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
    nestedPermissions: {
        setMuteRole: `commands.mute.setmuterole`
    },
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `${guild.configuration.prefix}${this.name} setMuteRole @Role`, false]);
            fields.push([`**Current mute role:**`, `${(typeof guild.configuration.moderation.muteRole == "string" && guild.configuration.moderation.muteRole != "none") ? `<@&${guild.configuration.moderation.muteRole}>` : `Not defined`}`, false]);
            fields.push([`**Usage:**`, `${guild.configuration.prefix}${this.name} <user> [time] [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configuration.prefix}${this.name} @DopeUsername Being too cool\n${guild.configuration.prefix}${this.name} 168754125874596348 Being too cool\n${guild.configuration.prefix}${this.name} DopeUsername#0420 30min Being too cool`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configuration.prefix}${this.name}`, `${description}`, undefined, undefined, fields);
        }
        if (args[0].toLowerCase() == "setmuterole") {
            let permissionToCheck = this.nestedPermissions.setMuteRole;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;
            if (!hasPermission) return utils.sendDenied(message, guild, `Insufficient Permissions`, `You are missing the permission \`${permissionToCheck}\`.`, `${message.author.tag}(${message.author.id}) tried to set muted role in [${message.channel.id}@${message.channel.guild.id}][Insufficient Permissions].`, `<@${message.author.id}>(${message.author.id}) tried to set muted role in <#${message.channel.id}>(${message.channel.id}). [Insufficient Permissions]`);
            if (message.mentions.roles.length == 0) return utils.sendError(message, guild, `Could not set mute role`, `No roles mentionned in your message.`);
            guild.configurationManager.set(`moderation.muteRole`, message.mentions.roles.first().id);
            return utils.sendMain(message, guild, `Mute role defined`, `Mute role defined to <@&${message.mentions.roles.first().id}>`);
        }
        if (typeof guild.configuration.moderation.muteRole != "string" || guild.configuration.moderation.muteRole == "") return utils.sendError(message, guild, `Could not mute`, `You must define the mute role before being able to mute.\nUse \`${guild.configuration.prefix}${this.name} setMuteRole @Role\``);
        
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
        if (result.errored == true) return utils.sendError(message, guild, `Could not mute user`, `${result.reason}`);
        return false;
    }
}