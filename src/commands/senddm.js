const {
    MessageEmbed
} = require(`discord.js`);
const urlExists = require('url-exists');

const utils = require(`../utils`);

module.exports = {
    name: "senddm",
    description: `Send a dm to a user.`,
    subcommands: {},
    aliases: ["dm"],
    permission: `commands.senddm`,
    nestedPermissions: {},
    category: `fun`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let user = undefined;
        let userString = args.shift();

        if (typeof userString != "undefined" && userString != "") {
            user = (userString.startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
                cache: false,
                force: true
            }).catch(e => {
                return undefined;
            }) : await message.channel.guild.members.fetch({
                cache: false,
                force: true
            }).then(members => members.find(member => member.user.tag === userString));
            if (typeof user == "undefined") user = await message.channel.guild.members.fetch(userString, {
                cache: false,
                force: true
            }).catch(e => {
                return undefined;
            });
            if (typeof user == "undefined") return utils.sendError(message, guild, `Could not get user data`, `User not found`, [], true); /*Updated To New Utils*/
        }

        let embed = new MessageEmbed({
            title: `DM Sent.`,
            color: guild.configurationManager.configuration.colors.success
        });

        if (typeof user == "undefined") return utils.sendError(message, guild, `Could not send DM.`, `User not found.`, [], true); /*Updated To New Utils*/

        
        let messageContent = args.join(' ');
        let messageAttachments = [];
        message.attachments.forEach(attachment => messageAttachments.push(attachment));

        user.send({content: (messageContent != "" && messageContent != " ") ? `${messageContent}` : null, files: messageAttachments}).catch(e => {
            return utils.sendError(message, guild, `Could not send DM.`, `${e.toString()}`, [], true); /*Updated To New Utils*/
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}