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

        embed.description += `- TobyBot save the last 25 messages from a user when warning, muting, kicking and banning.`;
        embed.description += `\n- New command \`t!lastmessages\` to list the last 25 messages of a user.`;
        embed.description += `\n- New command \`t!punishtranscript <caseId>\` to list the last 25 messages of a user before a punishment (warn, mute, kick, ban).`;
        embed.description += `\n- \`t!modlogs\` show if a transcript is available for each punishments.`;
        embed.description += `\n**The bot only cache message when running, restarting it clears the cache.**`;
        embed.description += `\n**This is still in testing, if this slows the bot in any way, it can be removed.**`;

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}