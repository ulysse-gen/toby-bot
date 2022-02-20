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

        if (args.length != 0) {
            user = (args[0].startsWith('<@') && message.mentions.users.size != 0) ? await message.channel.guild.members.fetch(message.mentions.users.first().id, {
                cache: false,
                force: true
            }).catch(e => {
                return undefined;
            }) : await message.channel.guild.members.fetch({
                cache: false,
                force: true
            }).then(members => members.find(member => member.user.tag === args[0]));
            if (typeof user == "undefined") user = await message.channel.guild.members.fetch(args[0], {
                cache: false,
                force: true
            }).catch(e => {
                return undefined;
            });
            if (typeof user == "undefined") return utils.sendError(message, guild, `Could not get user data`, `User not found`);
        }
        if (args.length == 0) user = await message.channel.guild.members.fetch(message.author.id, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });

        let userPFP = await new Promise((res, rej) => {
            let baseOfUrl = (user.avatar != null) ? `https://cdn.discordapp.com/avatars/${user.user.id}/${user.avatar}` : `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });


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