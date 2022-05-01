const {
    MessageEmbed
} = require(`discord.js`);

const {
    globalConfiguration,
    MainLog
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "invitelink",
    description: `Send the bot's invite link for him to join your server.`,
    aliases: ["invite"],
    slashCommandData: {
        options: []
    },
    permission: `commands.invitelink`,
    category: `informations`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        return utils.sendMain(message, guild, `Invite me to your server !`, `[**Click here to invite me to your server**](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`, undefined, (isSlashCommand) ? {ephemeral: true} : true);
    }
}