const {
    MessageEmbed,
    Collection
} = require(`discord.js`);
const moment = require('moment')

const utils = require(`../utils`);

module.exports = {
    name: "purge",
    description: `Bulk delete messages from a channel`,
    aliases: ["bulkdelete"],
    permission: `commands.purge`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        if (args.length == 0) return utils.sendError(message, guild, `No amount specified.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        let amount = args[0];
        try {
            amount = parseInt(args[0]);
        } catch (e) {
            return utils.sendError(message, guild, `Amount must be a number.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        }

        if (amount < 1) return utils.sendError(message, guild, `Amount must be at least 1.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        utils.sendSuccess(message, guild, `Purging channel from ${amount} messages.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/

        let messages = await new Promise(async (res, rej) => {
            for (let index = Math.ceil((amount / 100)); index > 0; index--) {
                let fetchedMessages = await await message.channel.messages.fetch({
                    limit: (index != 1 || amount == 100) ? 100 : amount - (Math.floor((amount / 100)) * 100)
                }).then(fetchedMessages => {
                    message.channel.bulkDelete(fetchedMessages.filter(message => !message.pinned), true).catch(e => {
                        return utils.sendError(message, guild, `Bulk deleted failed.`, `Could not bulk delete messages : ${e.toString()}`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
                    });
                    if (index == 1 || fetchedMessages.size == 0 || moment().subtract(14, 'days').isAfter(moment(fetchedMessages.last().createdTimestamp))) {
                        utils.sendSuccess(message, guild, `Purged channel from ${amount} messages.`, undefined, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
                        index = 0;
                        res(true);
                    }
                }).catch(e => res({
                    error: e.toString()
                }));
            }
        });
        if (typeof messages == "object" && typeof messages.error == "string") return utils.sendError(message, guild, `Bulk deleted failed.`, `${messages.error}`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
    }
}