//NodeJS Modules Imports
const colors = require(`colors`);
const moment = require(`moment`);
const {
    Client,
    Intents
} = require('discord.js');
const discordVoice = require('@discordjs/voice');
var heapdump = require('heapdump');
var fs = require('fs');

if (!fs.existsSync(`./MySQL.json`)){
    console.log(`Please create your MySQL.json file`);
    process.exit();
}

//Setup god damn INTENTS
let intents = new Intents();
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_VOICE_STATES);

//Classes Import
const Logger = require(`./src/classes/Logger`);
const sqlLogger = require(`./src/classes/sqlLogger`);
const commandsManager = require(`./src/classes/commandsManager`);
const permissionsManager = require(`./src/classes/permissionsManager`);
const configurationManager = require(`./src/classes/configurationManager`);
const guildsManager = require(`./src/classes/guildsManager`);
const sqlManager = require(`./src/classes/sqlManager`);

//Main Variables
const packageJson = require(`./package.json`);
const globalConfiguration = new configurationManager(client, undefined, `../../configuration.json`, `configuration`);
var configuration = globalConfiguration.configuration;

//Create Objects
//DiscordJS
var client = new Client({
    partials: ["CHANNEL"],
    intents: intents
});

//CommandManagers & PermissionsManagers
var globalCommands = new commandsManager(client);
var globalPermissions = new permissionsManager(client, undefined, `../../permissions.json`, `guildsPermissions`, `\`guildId\`='global'`);
var globalGuilds = new guildsManager(client);
var globalSqlManager = new sqlManager(client, globalCommands, globalPermissions, globalGuilds);

//Logs
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);
const AutoModLog = new Logger(`./logs/autoMod.log`);
const MainSQLLog = new sqlLogger();

client.on('ready', async () => {
    MainSQLLog.log(`Client Ready`, `Logged in as ${client.user.tag} on version ${packageJson.version}`);
    MainLog.log(`Successfully logged in as ${colors.green(client.user.tag)} ! [${configuration.appName.green}v${packageJson.version.green}]`);
    require(`./src/managers/presenceManager`)();
    require(`./src/managers/api`)();
    setInterval(() => globalSqlManager.checkForExpiredModeration(), 60000);
    setInterval(() => globalSqlManager.checkForReminders(), 5000);
    try {
        discordVoice.joinVoiceChannel({
            channelId: '921710545332228096',
            guildId: '891829347613306960',
            adapterCreator: await client.guilds.fetch('891829347613306960').then(guild => guild.voiceAdapterCreator),
            selfMute: false,
            selfDeaf: false
        }); //Auto join Members VC
    } catch (e) {
        MainLog.log(`Could not join VC. This message is normal in dev. ${e.toString()}`.yellow);
    }
});

client.on(`messageCreate`, async message => {
    await require(`./src/handlers/messageCreate`)(message);
    if (typeof this.executionTimes[message.id] != "undefined") {
        if (typeof this.executionTimes[message.id].commandExecuted != "undefined") {
            MainSQLLog.log(`Command Execution`, `${message.content}`, message.channel.guild.id, message.channel.id, message.author.id, message.id, this.executionTimes[message.id]); //Only runs if the thing on top was true, logs into console
            //console.log(`Command execution took ${this.executionTimes[message.id].commandExecuted.diff(this.executionTimes[message.id].messageCreate)}ms`);
        } else {
            delete this.executionTimes[message.id];
        }
    }
});
client.on(`interactionCreate`, interaction => require(`./src/handlers/interactionCreate`)(interaction));

client.on('error', (code) => {
    MainSQLLog.log(`DiscordJS Error`, `${code.toString()}`);
    MainLog.log(`[DiscordJS Error]`.red + ` ${code.toString().blue}`);
});

(async () => {
    await globalPermissions.initialize();
    await globalConfiguration.initialize();
    client.login(configuration.botToken);
})();

process.stdin.resume();

async function exitHandler(reason, exit) {
    if (reason == "SIGINT" || reason == "SIGUSR1" || reason == "SIGUSR2") {
        await ErrorLog.log(`[Process Exit][${reason}]Closing process, saving and closing.`);
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    } else if (reason == "uncaughtException" || reason == "unhandledRejection") {
        await ErrorLog.log(`[${reason}]Exception catched, error : ${exit.toString()}`);
        MainSQLLog.log(`[${reason.toString()}]`, `${exit.toString()}`);
        console.log(exit);
        return true;
    } else {
        await MainLog.log(`[Process Exit][${reason.toString()}] ${exit.toString()}`);
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    }
    process.exit();
    return true;
}

if (typeof enableCatching == "undefined" || (typeof enableCatching == "boolean" && enableCatching)) process.on('uncaughtException', (error) => {
    exitHandler("uncaughtException", error);
});

if (typeof enableCatching == "undefined" || (typeof enableCatching == "boolean" && enableCatching)) process.on('unhandledRejection', (error) => {
    exitHandler("unhandledRejection", error);
});

//do something when app is closing
process.on('exit', (code) => {
    exitHandler("exit", code);
});

//catches ctrl+c event
process.on('SIGINT', (code) => {
    exitHandler("SIGINT", code);
});

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', (code) => {
    exitHandler("SIGUSR1", code);
});
process.on('SIGUSR2', (code) => {
    exitHandler("SIGUSR2", code);
});


//Exports :
//DiscordJS Related:
module.exports.client = client;

//Loggers:
module.exports.MainLog = MainLog;
module.exports.ErrorLog = ErrorLog;
module.exports.AutoModLog = AutoModLog;
module.exports.MainSQLLog = MainSQLLog;

//Configurations:
module.exports.configuration = configuration;
module.exports.packageJson = packageJson;
module.exports.blockedUsers = [
    "793722644016005170",
    "955837853252853761"
]

//Export managers
module.exports.globalConfiguration = globalCommands;
module.exports.globalCommands = globalCommands;
module.exports.globalPermissions = globalPermissions;
module.exports.globalGuilds = globalGuilds;

//Debug stuff & more
module.exports.reload = false;
module.exports.enableCatching = false;
module.exports.executionTimes = {};