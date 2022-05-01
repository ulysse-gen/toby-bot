var rn = require("random-number");

const utils = require(`../utils`);

module.exports = {
    name: "coinflip",
    description: `Flip a coin !`,
    aliases: ["flip", "flipacoin", "cf"],
    usage: {
        main: `${this.name}`,
        args: []
    },
    permission: `commands.coinflip`,
    category: `fun`,
    cooldown: 300,
    globalCooldown: 250,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let headOrTails = [
            "https://cdn.discordapp.com/attachments/936578361302614018/937820858616008734/heads_ccexpress.png",
            "https://cdn.discordapp.com/attachments/936578361302614018/937820858817323038/tails_ccexpress.png"
        ]

        message.reply(`https://media.discordapp.net/attachments/936578361302614018/937817970170806292/flip_coin.gif`, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            setTimeout(() => {
                msg.edit(`${headOrTails[rn({min: 0, max: headOrTails.length - 1, integer: true})]}`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                })
            }, 2500);
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));


















        /*let embed = new MessageEmbed({
            title: `Flipping the coin`,
            color: guild.configurationManager.configuration.colors.main,
            image: {
                url: `https://cdn.discordapp.com/attachments/930708376311177227/937801144363782215/flip_coin.gif`
            }
        });

        let headOrTails = [
            "https://cdn.discordapp.com/attachments/930708376311177227/937801144745480272/heads_ccexpress.png",
            "https://cdn.discordapp.com/attachments/930708376311177227/937801145064255508/tails_ccexpress.png"
        ]

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            setTimeout(()=> {
                embed.image.url = headOrTails[Math.floor(Math.random()*headOrTails.length)];
                msg.edit({
                    embeds: [embed],
                    failIfNotExists: false
                }).catch(e => {
                    console.log(`Could not edit message ${e}`);
                })
            }, 2500);
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));*/
        return true;
    }
}