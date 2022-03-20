const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    packageJson,
    MainLog,
    globalCommands
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "reloadcommands",
    description: `Reload the bot commands.`,
    subcommands: {},
    aliases: ["rcmds", "reload"],
    permission: `commands.reload`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Reloaded commands`,
            color: guild.configuration.colors.success
        });
        await globalCommands.reload();
        delete require.cache[require.resolve(`../handlers/messageCreate`)];
        delete require.cache[require.resolve(`../handlers/interactionCreate`)];
        delete require.cache[require.resolve(`../handlers/DMHandler`)];
        delete require.cache[require.resolve(`../handlers/chatModeration`)];
        delete require.cache[require.resolve(`../handlers/commandHandler`)];
        delete require.cache[require.resolve(`../utils`)];
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