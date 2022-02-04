const {
    MessageEmbed
} = require(`discord.js`);

const {
    configuration,
    MainLog
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "invitelink",
    description: `Send the bot's invite link for him to join your server.`,
    aliases: ["invite"],
    permission: `commands.invitelink`,
    category: `informations`,
    category: `informations`,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Click here to invite me in your server !`,
            color: guild.configuration.colors.main,
            description: `https://discord.com/api/oauth2/authorize?client_id=${configuration.appId}&permissions=8&scope=bot`,
            url: `https://discord.com/api/oauth2/authorize?client_id=${configuration.appId}&permissions=8&scope=bot`
        })
        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}