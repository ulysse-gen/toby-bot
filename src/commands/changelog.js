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
    permission: `commands.changelog`,
    category: `informations`,
    async exec(client, message, args, guild = undefined) {
        var changelog = [
            "F Anna."
        ];
        let description = `- ` + changelog.shift();
        changelog.forEach(line => {
            description += `\n- ` + line;
        });

        return utils.sendMain(message, guild, `Changelog v${packageJson.version}`, `${description}`, [], true);
    }
}