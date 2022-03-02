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

        embed.description += `- New alias \`warns\` for the command \`warnings\`.`;
        embed.description += `\n- Ban can now ban users that are not present in the server currently. Reason is now saved in the AuditLog, but is saved in the modlogs.`;

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}