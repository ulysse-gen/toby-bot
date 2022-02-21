const {
    MessageEmbed
} = require(`discord.js`);
const prettyMilliseconds = require("pretty-ms");
const {
    configuration,
    package,
    MainLog
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "welcome",
    description: `Welcome a user in the server`,
    subcommands: {},
    aliases: [],
    permission: `commands.welcome`,
    category: `fun`,
    status: true,
    cooldown: 10,
    async exec(client, message, args, guild = undefined) {
        let embed = new MessageEmbed({
            title: (message.mentions.members.size != 0) ? `Hi there ${message.mentions.members.first().user.username}#${message.mentions.members.first().user.discriminator} !` : `Hi there !`,
            color: guild.configuration.colors.main,
            description: `Welcome to TobyCord`
        });
        embed.addField(`**📌 First of all, go read**`, `<#892106114865438721>`, true);
        embed.addField(`**📌 Make sure you get some**`, `<#907859717886447626>`, true);
        embed.addField(`**📌 If you want, you can also get**`, `<#920245689718542407>`, true);
        embed.addField(`**📌 And introduce yourself in**`, `<#944074797468487680>`, true);

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}