//NodeJS Modules Imports
const colors = require(`colors`);
const {
    Client,
    Intents
} = require('discord.js');
const { REST } = require('@discordjs/rest');
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
const metricsManager = require(`./src/classes/metricsManager`);

//Main Variables
const packageJson = require(`./package.json`);
const globalConfiguration = new configurationManager(client, `../../configuration.json`, `configuration`);

//Create Objects
//DiscordJS
var client = new Client({
    partials: ["CHANNEL"],
    intents: intents
});
var rest = undefined;
const errorCatching = true;

//CommandManagers & PermissionsManagers
var globalCommands = new commandsManager(client);
var globalPermissions = new permissionsManager(client, `../../permissions.json`, `guildsPermissions`);
var globalGuilds = new guildsManager(client);
var globalSqlManager = new sqlManager(client, globalCommands, globalPermissions, globalGuilds);
var globalMetrics = new metricsManager();

//Logs
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);
const AutoModLog = new Logger(`./logs/autoMod.log`);
const MainSQLLog = new sqlLogger();

var botLifeMetric = globalMetrics.createMetric("botLifeMetric");

client.on('ready', async () => {
    botLifeMetric.addEntry("botReady");
    MainSQLLog.log(`Client Ready`, `Logged in as ${client.user.tag} on version ${packageJson.version}`);
    MainLog.log(`Successfully logged in as ${colors.green(client.user.tag)} ! [${globalConfiguration.configuration.appName.green}v${packageJson.version.green}]`);
    require(`./src/managers/presenceManager`)();
    require(`./src/managers/api`)();
    setInterval(() => globalSqlManager.checkForExpiredModeration(), 20000);
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
    if (typeof message.customMetric != "undefined")message.customMetric.end();
});

client.on(`interactionCreate`, interaction => require(`./src/handlers/interactionCreate`)(interaction));

client.on('error', (code) => {
    botLifeMetric.addEntry("botError", {error: code});
    MainSQLLog.log(`DiscordJS Error`, `${code.toString()}`);
    MainLog.log(`[DiscordJS Error]`.red + ` ${code.toString().blue}`);
});

(async () => {
    botLifeMetric.addEntry("globalConfInit");
    await globalConfiguration.initialize();
    botLifeMetric.addEntry("globalPermInit");
    await globalPermissions.initialize();
    botLifeMetric.addEntry("clientLogin");
    await client.login(globalConfiguration.configuration.botToken);
    rest = new REST({ version: '9' }).setToken(globalConfiguration.configuration.botToken);
    botLifeMetric.addEntry("globalCmdsInit");
    await globalCommands.initialize(globalCommands.commandsFolder, rest);
})();

process.stdin.resume();

async function exitHandler(reason, exit) {
    if (reason == "SIGINT" || reason == "SIGUSR1" || reason == "SIGUSR2") {
        await ErrorLog.log(`[Process Exit][${reason}]Closing process, saving and closing.`);
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    } else if (reason == "uncaughtException" || reason == "unhandledRejection") {
        botLifeMetric.addEntry("uncaughtException", {error: exit});
        await ErrorLog.log(`[${reason}]Exception catched, error : ${exit.toString()}`);
        MainSQLLog.log(`[${reason.toString()}]`, `${exit.toString()}`);
        console.log(exit);
        return true;
    } else {
        await MainLog.log(`[Process Exit][${reason.toString()}] ${exit.toString()}`);
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    }
    await botLifeMetric.end();
    process.exit();
    return true;
}

if (typeof errorCatching == "undefined" || (typeof errorCatching == "boolean" && errorCatching)) process.on('uncaughtException', (error) => {
    exitHandler("uncaughtException", error);
});

if (typeof errorCatching == "undefined" || (typeof errorCatching == "boolean" && errorCatching)) process.on('unhandledRejection', (error) => {
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

//Configurations
module.exports.packageJson = packageJson;
module.exports.blockedUsers = [
    "793722644016005170",
    "955837853252853761"
]

//Export managers
module.exports.globalConfiguration = globalConfiguration;
module.exports.globalCommands = globalCommands;
module.exports.globalPermissions = globalPermissions;
module.exports.globalGuilds = globalGuilds;
module.exports.globalMetrics = globalMetrics;

//Debug stuff & more
module.exports.reload = false;
module.exports.errorCatching = errorCatching;
module.exports.executionTimes = {};
module.exports.botLifeMetric = botLifeMetric;