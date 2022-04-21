module.exports = {
    name: "impossiblecommand",
    description: `A command to try the behavior of "Insufficient permission".`,
    aliases: ["impcommand"],
    usage: {
        main: `${this.name}`,
        args: []
    },
    permission: `commands.impossiblecommand`,
    category: `administration`,
    async exec(client, message, args, guild = undefined) {
        if (guild.configurationManager.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => {
            /*console.log(`Could not delete..`);*/
        })
        return true;
    }
}