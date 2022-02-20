const {
    MessageEmbed
} = require(`discord.js`);

const {
    configuration,
    MainLog
} = require(`../../index`);
const timestring = require('timestring')
const utils = require(`../utils`);

module.exports = {
    name: "ben",
    description: `Ben a member`,
    aliases: ["benuser", "benmember"],
    permission: `commands.ben`,
    category: `moderation`,
    async exec(client, message, args, guild = undefined) {
        message.reply(`L loser cant spell`);
        return false;
    }
}