const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    configuration,
    package,
    MainLog
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "deletepunishment",
    description: `Delete a punishment from the database.`,
    subcommands: {},
    aliases: [],
    permission: `commands.deletepunishment`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Punishment removed`,
            color: guild.configuration.colors.main
        });
        if (args.length == 0)return utils.sendError(message, guild, `Wrong command synthax.`, `Use \`deletepunishment <caseId> [reason]\` to delete a punishment.`)
        let caseId = args.shift();
        let reason = args.join(' ');
        if (guild.configuration.moderation.deletePunishmentNeedReason && (typeof reason == "undefined" || reason == "" || reason.replaceAll(' ', '') == "")) return utils.sendError(message, guild, `No reason specified.`);
        if (typeof caseId == "undefined" || caseId == "" || caseId.replaceAll(' ', '') == "") return utils.sendError(message, guild, `No caseId specified.`);
        let result = await guild.moderationManager.deletePunishment(message, caseId, reason);
        if (result == false)embed.setTitle(`Could not remove punishment`).setColor(guild.configuration.colors.error);
        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}