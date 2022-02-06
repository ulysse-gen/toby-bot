const {
    MessageEmbed
} = require(`discord.js`);

const utils = require(`../utils`);

module.exports = {
    name: "purge",
    description: `Bulk delete messages from a channel`,
    aliases: ["bulkdelete"],
    permission: `commands.purge`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) return utils.sendError(message, guild, `No amount specified.`);
        let amount = args[0];
        try {
            amount = parseInt(args[0]);
        } catch (e) {
            return utils.sendError(message, guild, `Amount must be a number.`);
        }

        let embed = new MessageEmbed({
            title: `Purging ${amount} messages from the channel`,
            color: guild.configuration.colors.main
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(async msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            message.channel.bulkDelete((await message.channel.messages.fetch({limit: amount+2})).filter(message => !message.pinned), true).then(() => {
                return utils.sendSuccess(message, guild, `Bulk deleted ${amount} messages successfully.`);
            });
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}