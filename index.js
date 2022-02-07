//NodeJS Modules Imports
const colors = require(`colors`);
const {
    Client,
    Intents
} = require('discord.js');
const discordVoice = require('@discordjs/voice');

//Setup god damn INTENTS
let intents = new Intents();
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING);

//Classes Import
const Logger = require(`./src/classes/Logger`);
const sqlLogger = require(`./src/classes/sqlLogger`);
const commandsManager = require(`./src/classes/commandsManager`);
const permissionsManager = require(`./src/classes/permissionsManager`);
const configurationManager = require(`./src/classes/configurationManager`);
const guildsManager = require(`./src/classes/guildsManager`);
const moderationManager = require(`./src/classes/moderationManager`);

//Main Variables
const package = require(`./package.json`);
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
var globalModeration = new moderationManager(client, globalGuilds);

//Logs
const MainLog = new Logger();
const MainSQLLog = new sqlLogger();

client.on('ready', async () => {
    MainSQLLog.log(`Client Ready`, `Logged in as ${client.user.tag} on version ${package.version}`);
    MainLog.log(`Successfully logged in as ${colors.green(client.user.tag)} ! [${configuration.appName.green}v${package.version.green}]`);
    require(`./src/managers/presenceManager`)();
    setInterval(() => globalModeration.checkForExpired(), 30000);
    try {discordVoice.joinVoiceChannel({channelId:'921710545332228096',guildId:'891829347613306960',adapterCreator: await client.guilds.fetch('891829347613306960').then(guild => guild.voiceAdapterCreator).catch(e => {})}).catch(e => {}); //Auto join Members VC
    }catch(e) { console.log(`Could not join VC. This message is normal in dev.`); }
});

client.on(`messageCreate`, message => require(`./src/handlers/messageCreate`)(message));


client.on('error', (code) => {
    MainSQLLog.log(`DiscordJS Error`, `${code.toString()}`);
    MainLog.log(`${`[DiscordJS Error]`.red} ${code.toString().blue}`);
});


(async () => {
    await globalPermissions.initialize();
    await globalConfiguration.initialize();
    client.login(configuration.botToken);
})();

process.stdin.resume();

async function exitHandler(reason, exit) {
    if (reason == "SIGINT" || reason == "SIGUSR1" || reason == "SIGUSR2"){
        await MainLog.log(`[Process Exit][${reason}]Closing process, saving and closing.`);
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    }else if (reason == "uncaughtException" || reason == "unhandledRejection"){
        await MainLog.log(`[${reason}]Exception catched, error : ${exit.toString()}`);
        MainSQLLog.log(`[${reason.toString()}]`, `${exit.toString()}`);
        console.log(exit);
        return true;
    } else {
        await MainLog.log(`${`[Process Exit]`}[${reason.toString()}] ${exit.toString()}`);
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    }
    /*await new Promise((res, rej) => {
        let control = Object.keys(globalGuilds.guilds).length;
        if (control <= 0)res(true);
        for (const key in globalGuilds.guilds) {
            globalGuilds.guilds[key].channelLog(`I am stopping, i should get back on quick !`);
            globalGuilds.guilds[key].configurationManager.save(true);
            control--;
            if (control <= 0)res(true);
        }
    })*/
    process.exit();
    return true;
}

let enableCatching = true;

if (enableCatching)process.on('uncaughtException', (error) => {
    exitHandler("uncaughtException", error);
});

if (enableCatching)process.on('unhandledRejection', (error) => {
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
module.exports.MainSQLLog = MainSQLLog;

//Configurations:
module.exports.configuration = configuration;
module.exports.package = package;

//Export managers
module.exports.globalConfiguration = globalCommands;
module.exports.globalCommands = globalCommands;
module.exports.globalPermissions = globalPermissions;
module.exports.globalGuilds = globalGuilds;
