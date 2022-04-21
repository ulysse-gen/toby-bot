var rn = require("random-number");

const utils = require(`../utils`);

module.exports = {
    name: "rolldice",
    description: `Roll a dice !`,
    aliases: ["roll", "rolladice", "rd"],
    permission: `commands.rolldice`,
    category: `fun`,
    cooldown: 300,
    globalCooldown: 250,
    async exec(client, message, args, guild = undefined) {
        let diceFaces = [
            "xxxxxxxxxxxxxxxx1",
            "xxxxxxxxxxxxxxxx2",
            "xxxxxxxxxxxxxxxx3",
            "xxxxxxxxxxxxxxxx4",
            "xxxxxxxxxxxxxxxx5",
            "xxxxxxxxxxxxxxxx6"
        ]

        message.reply(`Rolling the dice !`, false).then(msg => {
            if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            let rollOccur = rn({min: 3, max: 4, integer: true});
            let rollInterval = setInterval(() => {
                if (rollOccur != 0)msg.edit(`Rolling the dice : **${rn({min: 1, max: 6, integer: true})}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                if (rollOccur == 0)msg.edit(`Dice rolled and landed on : **${rn({min: 1, max: 6, integer: true})}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                rollOccur--;
                if (rollOccur < 0)clearInterval(rollInterval);
            }, 1111);
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}