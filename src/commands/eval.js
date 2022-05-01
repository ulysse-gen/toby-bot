const {
    MessageEmbed
} = require(`discord.js`);
const {
    globalConfiguration,
    packageJson,
    MainLog,
    globalMetrics,
    botLifeMetric
} = require(`../../index`);
const discordVoice = require('@discordjs/voice');

const utils = require(`../utils`);

module.exports = {
    name: "eval",
    description: `Eval javascript.`,
    aliases: [],
    permission: `commands.eval`,
    category: `danger`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let embed = new MessageEmbed({
            title: `Eval :`,
            color: guild.configurationManager.configuration.colors.success
        });

        if (args.length == 0) return utils.sendError(message, guild, `Could not eval`, `Args empty`, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/
        if (args[0] == "help") return utils.sendMain(message, guild, `Eval quick help`, `Return variable = \`returnValue\``, [], (isSlashCommand) ? {ephemeral: true} : true); /*Updated To New Utils*/

        embed.description = await new Promise(async (res, rej) => {
            let returnValue = `No return value.`;
            try {
                returnValue = eval(args.join(' '));
                res(`\`\`\`${returnValue.toString()}\`\`\``);
            } catch (e) {
                embed.color = guild.configurationManager.configuration.colors.error;
                res(`Could not eval : ${e.toString()}`);
            }
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}