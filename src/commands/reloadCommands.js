const {
    MessageEmbed
} = require(`discord.js`);
const util = require('util');
const exec = util.promisify(require('child_process').exec);


const {
    globalConfiguration,
    packageJson,
    MainLog,
    globalCommands
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = {
    name: "reload",
    description: `Reload bot commands, certain modules as well as the configuration.`,
    subcommands: {},
    slashCommandData: {
        options: []
    },
    aliases: ["rcmds"],
    permission: `commands.reload`,
    category: `informations`,
    status: true,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let embed = new MessageEmbed({
            title: `Reloaded`,
            color: guild.configurationManager.configuration.colors.success
        });

        /*await exec("git pull --tags origin develop");
        await exec("npm i -y");*/
        
        await globalConfiguration.load();
        
        delete require.cache[require.resolve(`../handlers/messageCreate`)];
        delete require.cache[require.resolve(`../handlers/interactionCreate`)];
        delete require.cache[require.resolve(`../handlers/DMHandler`)];
        delete require.cache[require.resolve(`../handlers/chatModeration`)];
        delete require.cache[require.resolve(`../handlers/commandHandler`)];
        delete require.cache[require.resolve(`../utils`)];
        await globalCommands.reload();
        let fields = [[`**Commands loaded**`, `${globalCommands.commands.length}`, true]];

        return utils.sendSuccess(message, guild, `Reloaded`, undefined, fields, (isSlashCommand) ? {ephemeral: true} : true);
    }
}