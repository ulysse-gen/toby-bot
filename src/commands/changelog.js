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
        let embed = new MessageEmbed({
            title: `Changelog for ${configuration.appName}v${package.version}`,
            color: guild.configuration.colors.main,
            description: ''
        });

        embed.description += `- New command \`notes <@User/UserId/UserTag#0420>\` to list members notes.`;
        embed.description += `\n- New command \`warnings <@User/UserId/UserTag#0420>\` to list members warns.`;
        embed.description += `\n- New configuration settings to send logs as embed, preventing taggins every logs`;
        embed.description += `\n*Embed logging is still in beta, might take a few updates to get all logs to be sent as embeds*`;

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}