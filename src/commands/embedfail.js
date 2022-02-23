const {
    MessageEmbed
} = require(`discord.js`);

const {
    configuration,
    MainLog,
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "embedfail",
    description: `the title says it all`,
    aliases: ["ef"],
    permission: `commands.embedfail`,
    nestedPermissions: {
        tag: `commands.embedfail.tag`
    },
    category: `fun`,
    cooldown: 300,
    globalCooldown: 120,
    async exec(client, message, args, guild = undefined) {
        let images = [
            "https://tenor.com/view/epic-embed-fail-embed-embed-fail-sammyclassicsonicfan-bv0j-gif-22247411",
            "https://tenor.com/view/epic-embed-fail-ryan-gosling-cereal-embed-failure-laugh-at-this-user-gif-20627924",
            "https://tenor.com/view/epic-embed-fail-cell-perfect-cell-gif-22387176",
            "https://tenor.com/view/epic-embed-fail-xqc-embed-gif-19868175",
            "https://tenor.com/view/jesus-ballin-mars-bars-gif-19910027",
            "https://tenor.com/view/embed-fail-gif-21166005",
            "https://tenor.com/view/embed-fail-epic-embed-fail-gif-23518604"
        ];

        let sendThis = `${images[Math.floor(Math.random()*images.length)]}`;

        let permissionToCheck = this.nestedPermissions.tag;
        let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
        let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;

        if (hasPermission)
            if (message.mentions.members.size != 0) sendThis = `<@${message.mentions.members.first().user.id}> ${sendThis}`;

        message.channel.send(`${sendThis}`).then(msg => {
            message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.catchCustomLog(message, guild, e, `Could not send message`));
        return true;
    }
}