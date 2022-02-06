const Random = require('crypto-random');

const utils = require(`../utils`);

module.exports = {
    name: "choose",
    description: `Choose between choices`,
    aliases: [],
    permission: `commands.choose`,
    category: `fun`,
    async exec(client, message, args, guild = undefined) {
        let possibilities = (args.join(' ').includes(',')) ? args.join(' ').split(',') : args;

        message.reply(`Lemme think a bit..`, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            let rollOccur = Random.range(3, 4);
            let rollInterval = setInterval(() => {
                if (rollOccur != 0)msg.edit(`Lemme think a bit.. **${possibilities[Random.range(0, possibilities.length-1)]}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                if (rollOccur == 0)msg.edit(`Okay, after some thinking ill stick with **${possibilities[Random.range(0, possibilities.length-1)]}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                rollOccur--;
                if (rollOccur < 0)clearInterval(rollInterval);
            }, 1111);
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}