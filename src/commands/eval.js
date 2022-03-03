const {
    MessageEmbed
} = require(`discord.js`);
const {
    configuration,
    package,
    MainLog
} = require(`../../index`);
const discordVoice = require('@discordjs/voice');

const utils = require(`../utils`);

module.exports = {
    name: "eval",
    description: `Eval javascript.`,
    aliases: [],
    permission: `commands.eval`,
    category: `danger`,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: `Eval :`,
            color: guild.configuration.colors.success
        });

        if (args.length == 0) return utils.sendError(message, guild, `Could not eval`, `Args empty`, [], true); /*Updated To New Utils*/
        if (args[0] == "help") return utils.sendMain(message, guild, `Eval quick help`, `Return variable = \`returnValue\``, [], true); /*Updated To New Utils*/

        embed.description = await new Promise(async (res, rej) => {
            let returnValue = `No return value.`;
            try {
                returnValue = eval(args.join(' '));
                res(`\`\`\`${returnValue.toString()}\`\`\``);
            } catch (e) {
                embed.color = guild.configuration.colors.error;
                res(`Could not eval : ${e.toString()}`);
            }
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}