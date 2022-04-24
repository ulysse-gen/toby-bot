const {
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);
const axios = require("axios");

module.exports = {
    name: "hug",
    description: `Send a hug`,
    aliases: ["cuddle"],
    permission: `commands.hug`,
    nestedPermissions: {
        tag: `commands.hug.tag`,
        reply: `commands.hug.reply`
    },
    category: `fun`,
    cooldown: 45,
    globalCooldown: 30,
    async exec(client, message, args, guild = undefined) {
        let possibilities = await axios.get('https://g.tenor.com/v1/search?q=hug%20anime&key=LIVDSRZULELA&limit=15').then(data => {
            return data.data.results.map(data => {
                if (!data.itemurl.includes("double") && !data.itemurl.includes("nigg")) return data.url;
            });
        }).catch(error => {
            utils.catchCustomLog(message, guild, e, `Could not fetch hug gifs.`);
            return [];
        });

        if (possibilities.length <= 0)return utils.sendError(message, guild, `Could not get gif.`);

        let sendThis = `<@${message.author.id}> sent a hug ! ${possibilities[Math.floor(Math.random()*possibilities.length)]}`;

        let permissionToCheck = this.nestedPermissions.reply;
        let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

        if (hasPermission)
            if (typeof message.type != "undefined" && message.type == "REPLY") return message.channel.messages.fetch(message.reference.messageId).then(fetchedMessage => {
                fetchedMessage.reply(`${sendThis}`).catch(e => utils.catchCustomLog(message, guild, e, `Could not reply to message.`));
                if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.catchCustomLog(message, guild, e, `Could not fetch message.`));

        permissionToCheck = this.nestedPermissions.tag;
        hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
        hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

        if (hasPermission)
            if (message.mentions.members.size != 0) sendThis = `Hey <@${message.mentions.members.first().user.id}>, <@${message.author.id}> sent you a hug ${possibilities[Math.floor(Math.random()*possibilities.length)]}`;

        message.channel.send(`${sendThis}`).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.catchCustomLog(message, guild, e, `Could not send message`));
        return true;
    }
}