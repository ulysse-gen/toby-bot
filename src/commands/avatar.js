const {
    MessageEmbed
} = require(`discord.js`);
const urlExists = require('url-exists');

const utils = require(`../utils`);

module.exports = {
    name: "avatar",
    description: `Show someone's avatar.`,
    subcommands: {},
    aliases: ["av"],
    permission: `commands.avatar`,
    nestedPermissions: {},
    category: `fun`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let user = undefined;

        if (args.length != 0) user = await guild.grabUser(message, args[0]);
        if (args.length == 0) user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        let userPFP = await utils.getUserPfp(user);

        let embed = new MessageEmbed({
            color: user.displayHexColor,
            author: {
                name: user.user.tag,
                iconURL: `${userPFP}?size=64`
            },
            image: {
                url: `${userPFP}?size=4096`
            }
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}