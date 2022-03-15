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
        description = `\n- New \`sticky\` command with \`pin\` alias. Kinda like a note but appear on top of every others player punishments on \`modlogs\`.`
        description += `\n- New \`stickyhistory\` command with \`sh\` alias. List the history of all the sticky notes that a user ever had.`
        return utils.sendMain(message, guild, `Changelog v${package.version}`, `${description}`, [], true);
    }
}