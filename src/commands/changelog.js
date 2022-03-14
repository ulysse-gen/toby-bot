const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    package,
    MainLog
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "changelog",
    description: `Send the latest changelog. Not gonna lie its not updated really often.`,
    aliases: ["whatsnew"],
    permission: `commands.changelog`,
    category: `informations`,
    async exec(client, message, args, guild = undefined) {
        let description = `- Embedfail now rely on https://tenor.com/, filters can be applied hard coded, if you see a weird gif sent by the bot please tell me asap.`
        description += `\n- New \`hug\` command.`
        description += `\n- New \`kiss\` command.`
        return utils.sendMain(message, guild, `Changelog v${package.version}`, `${description}`, [], true);
    }
}