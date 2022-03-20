var rn = require("random-number");

const utils = require(`../utils`);

module.exports = {
    name: "choose",
    description: `Choose between choices`,
    aliases: [],
    usage: {
        main: `${this.name}`,
        args: [{
            description: "Main Choice",
            placeholder: ["canBeOneChoiceWithoutSpaces", "Or multiple ones, separated by commas"],
            type: "String",
            optionnal: false
        },
        {
            description: "Other choice",
            placeholder: ["isOneChoiceWithoutSpaceOnlyIfNoCommasUsed"],
            type: "String",
            optionnal: true
        }]
    },
    permission: `commands.choose`,
    category: `fun`,
    async exec(client, message, args, guild = undefined) {
        let possibilities = (args.join(' ').includes(',')) ? args.join(' ').split(',') : args;

        message.reply(`Lemme think a bit..`, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            let rollOccur = rn({min: 3, max: 4, integer: true});
            let rollInterval = setInterval(() => {
                if (rollOccur != 0)msg.edit(`Lemme think a bit.. **${possibilities[rn({min: 0, max: possibilities.length-1, integer: true})]}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                if (rollOccur == 0)msg.edit(`Okay, after some thinking ill stick with **${possibilities[rn({min: 0, max: possibilities.length-1, integer: true})]}**`).catch(e => {
                    console.log(`Could not edit message ${e}`);
                });
                rollOccur--;
                if (rollOccur < 0)clearInterval(rollInterval);
            }, 1111);
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}