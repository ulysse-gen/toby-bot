const {
    MessageEmbed
} = require(`discord.js`);
const {
    globalConfiguration,
    packageJson,
    MainLog
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "changelog",
    description: `Send the latest changelog. Not gonna lie its not updated really often.`,
    aliases: ["whatsnew"],
    usage: {
        main: `${this.name}`,
        args: []
    },
    permission: `commands.changelog`,
    category: `informations`,
    async exec(client, message, args, guild = undefined) {
        let description = `- Revamped configuration and permission handling.`;
        description += `\n- AutoMod Discord Invite module added.`;
        description += `\n- Revamped \`configuration\` command.`;
        description += `\n- Starting a documentation, config documentation at https://tobybot.ubd.ovh/documentation/configuration?prefix=${guild.configurationManager.configuration.prefix}.`;
        description += `\n- Moderation command have their slash command version.`;
        return utils.sendMain(message, guild, `Changelog v${packageJson.version}`, `${description}`, [], true);
    }
}