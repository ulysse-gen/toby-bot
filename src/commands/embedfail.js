const {
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);
const axios = require("axios");

module.exports = {
    name: "embedfail",
    description: `the title says it all`,
    aliases: ["ef"],
    permission: `commands.embedfail`,
    nestedPermissions: {
        tag: `commands.embedfail.tag`,
        reply: `commands.embedfail.reply`
    },
    category: `fun`,
    cooldown: 300,
    globalCooldown: 120,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let possibilities = await axios.get('https://g.tenor.com/v1/search?q=embed%20fail&key=LIVDSRZULELA&limit=15').then(data => {
            return data.data.results.map(data => {
                if (!data.itemurl.includes("double") && !data.itemurl.includes("nigg")) return data.url;
            });
        }).catch(error => {
            utils.catchCustomLog(message, guild, e, `Could not fetch embed fail gifs.`);
            return [
                "https://tenor.com/view/epic-embed-fail-embed-embed-fail-sammyclassicsonicfan-bv0j-gif-22247411",
                "https://tenor.com/view/epic-embed-fail-ryan-gosling-cereal-embed-failure-laugh-at-this-user-gif-20627924",
                "https://tenor.com/view/epic-embed-fail-cell-perfect-cell-gif-22387176",
                "https://tenor.com/view/epic-embed-fail-xqc-embed-gif-19868175",
                "https://tenor.com/view/jesus-ballin-mars-bars-gif-19910027",
                "https://tenor.com/view/embed-fail-gif-21166005",
                "https://tenor.com/view/embed-fail-epic-embed-fail-gif-23518604"
            ];
        });

        let sendThis = `${possibilities[Math.floor(Math.random()*possibilities.length)]}`;

        let permissionToCheck = this.nestedPermissions.reply;
        let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

        if (hasPermission)
            if (typeof message.type != "undefined" && message.type == "REPLY") return message.channel.messages.fetch(message.reference.messageId).then(fetchedMessage => {
                fetchedMessage.reply(`${sendThis}`).catch(e => utils.catchCustomLog(message, guild, e, `Could not reply to message.`));
                message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.catchCustomLog(message, guild, e, `Could not fetch message.`));

        permissionToCheck = this.nestedPermissions.tag;
        hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
        hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

        if (hasPermission)
            if (message.mentions.members.size != 0) sendThis = `<@${message.mentions.members.first().user.id}> ${sendThis}`;

        message.channel.send(`${sendThis}`).then(msg => {
            message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.catchCustomLog(message, guild, e, `Could not send message`));
        return true;
    }
}