const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
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
        let description = `wow, a shit ton of things tbh..`;
        return utils.sendMain(message, guild, `Changelog v${packageJson.version}`, `${description}`, [], true);
    }
}