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

        embed.description += `\n- New command \`t!choose <choice1> <choice2> [choice3] .. [choice9999]\` to choose between multiple choices. Can be separated by spaces or comma. (Have to choose, cannot use both)`;
        embed.description += `\n- New command \`t!rockpaperscissors\` play a rock paper scissors game VS Toby, 3 rounds.`;
        embed.description += `\n- New command \`t!rolldice\` roll a dice and pick a random number between [1, 6].`;

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}