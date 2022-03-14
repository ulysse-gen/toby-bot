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
        let description = `- Modlogs now show unbans infos.`
        description = `\n- Modlogs now show unmutes infos.`
        description = `\n- Replying to a user with \`ef\` command now reply to that message with the embedfail gif.`
        description = `\n- Russian Roulette now auto pin & unpin the main message if the start timer is above 150 seconds.`
        return utils.sendMain(message, guild, `Changelog v${package.version}`, `${description}`, [], true);
    }
}