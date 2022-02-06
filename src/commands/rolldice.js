const Random = require('crypto-random');

const utils = require(`../utils`);

module.exports = {
    name: "rolldice",
    description: `Roll a dice !`,
    aliases: ["roll", "rolladice", "rd"],
    permission: `commands.rolldice`,
    category: `fun`,
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
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            let rollOccur = Random.range(3, 4);
            let rollInterval = setInterval(() => {
                if (rollOccur != 0)msg.edit(`Rolling the dice : **${Random.range(1, 6)}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                if (rollOccur == 0)msg.edit(`Dice rolled and landed on : **${Random.range(1, 6)}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                rollOccur--;
                if (rollOccur < 0)clearInterval(rollInterval);
            }, 1111);
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}