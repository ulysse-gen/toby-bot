const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    package,
    MainLog,
    globalCommands
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "reloadcommands",
    description: `Reload the bot commands.`,
    subcommands: {},
    aliases: ["rcmds"],
    permission: `commands.reloadcommands`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Reloaded commands`,
            color: guild.configuration.colors.success
        });
        await globalCommands.reload();
        embed.addField(`**Commands loaded**`, `${globalCommands.commands.length}`, true);

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}