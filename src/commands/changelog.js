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
    slashCommandData: {
        options: []
    },
    permission: `commands.changelog`,
    category: `informations`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        var changelog = [
            "Added some more slash commands", "Improvements and fixes for slash commands", "Fixed `welcome` (thanks <@613018772545994755> edit queen)"
        ];
        let description = `- ` + changelog.shift();
        changelog.forEach(line => {
            description += `\n- ` + line;
        });

        return utils.sendMain(message, guild, `Changelog v${packageJson.version}`, `${description}`, [], (isSlashCommand) ? {
            ephemeral: false
        } : true);
    }
}