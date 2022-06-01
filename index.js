/////////////////////////////////
//Toby Bot - Discord Utility Bot
//Project idea from holidae#8454
//     and UlysseGenie#9555
//Developped by UlysseGenie#9555
//   Thanks to Tobias Dray's
//Discord Server for the tests
/////////////////////////////////

//Importing NodeJS modules
const { I18n } = require('i18n');

//Importing classes
const FileLogger = require('./src/classes/FileLogger');
const FileConfigurationManager = require('./src/classes/FileConfigurationManager');
const TobyBot = require('./src/classes/TobyBot');

//Creating main objects
const TopConfigurationManager = new FileConfigurationManager('configuration.json'); //This is the main -- top level -- config. Containing the MySQL details
const i18n = new I18n({
    locales: ['en-US'],
    directory: 'locales/backend',
    fallbackLocale: 'en-US',
    defaultLocale: 'en-US'
});

//Creating main variables
const PackageInformations = require(`./package.json`);
const MainLog = new FileLogger();
const ErrorLog = new FileLogger(`error.log`);

const GlobalBot = new TobyBot(i18n, PackageInformations, TopConfigurationManager); //This is the bot

GlobalBot.start().catch(e => {
    if (typeof e == "string"){
        ErrorLog.error(e.toString());
    }else {
        console.log(e);
    }
    process.exit(1);
});

if (GlobalBot.catchErrorsPreventClose){
    process.on('uncaughtException', (error) => {
        exitHandler("uncaughtException", error);
    });
    process.on('unhandledRejection', (error) => {
        exitHandler("unhandledRejection", error);
    });
}

//Exit and crash thingy
process.stdin.resume();

//Exit handling function
async function exitHandler(reason, exit) {
    if (reason == "SIGINT" || reason == "SIGUSR1" || reason == "SIGUSR2") {
        await MainLog.log(`[Process Exit][${reason}]Closing process, saving and closing.`);
    } else if (reason == "uncaughtException" || reason == "unhandledRejection") {
        GlobalBot.LifeMetric.addEntry("uncaughtException", {error: exit});
        await ErrorLog.error(`[${reason}]Exception catched, error : ${exit.toString()}`);
        console.log(exit);
        return true;
    } else {
        MainSQLLog.log(`Process Exit`, `[${reason.toString()}] ${exit.toString()}`);
    }
    await GlobalBot.LifeMetric.end();
    process.exit();
}

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