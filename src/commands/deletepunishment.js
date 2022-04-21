const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    globalConfiguration,
    packageJson,
    MainLog
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "deletepunishment",
    description: `Delete a punishment from the database.`,
    subcommands: {},
    aliases: ["deletepunish", "delpunish","deletewarn","delwarn","deletenote","delnote","deletesticky","delsticky"],
    permission: `commands.deletepunishment`,
    category: `moderation`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Punishment removed`,
            color: guild.configurationManager.configuration.colors.main
        });
        if (args.length == 0)return utils.sendError(message, guild, `Wrong command synthax.`, `Use \`deletepunishment <caseId> [reason]\` to delete a punishment.`, [], true); /*Updated To New Utils*/
        let caseId = args.shift();
        let reason = args.join(' ');
        if (guild.configurationManager.configuration.moderation.deletePunishmentNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return utils.sendError(message, guild, `Could not delete punishment.`, `No reason specified.`, [], true); /*Updated To New Utils*/
        if (typeof caseId == "undefined" || caseId == "" || caseId.replaceAll(' ', '') == "") return utils.sendError(message, guild, `Could not delete punishment.`, `No caseId specified.`, [], true); /*Updated To New Utils*/
        let result = await guild.moderationManager.deletePunishment(message, caseId, reason);
        if (typeof result == "object"){
            embed.setTitle(`Could not delete punishment.`).setDescription(result.error).setColor(guild.configurationManager.configuration.colors.error);
        }
        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}