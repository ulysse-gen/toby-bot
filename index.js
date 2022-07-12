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
const TopConfigurationManager = new FileConfigurationManager('configuration.json', require('./configurations/defaults/TopConfiguration.json')); //This is the main -- top level -- config. Containing the MySQL details
const i18n = new I18n({
    locales: ['en-US','fr-FR'],
    directory: 'locales/backend',
    fallbackLocale: 'en-US',
    defaultLocale: 'en-US',
    autoReload: true,
});

//Creating main variables
const PackageInformations = require(`./package.json`);
const MainLog = new FileLogger();
const ErrorLog = new FileLogger(`error.log`);

const GlobalBot = new TobyBot(i18n, PackageInformations, TopConfigurationManager); //This is the bot

GlobalBot.start().catch(e => {
    ErrorLog.log(`An error occured:`);
    console.log(e);
    process.exit(1);
});

//More debug stuff

process.stdin.resume();

process.on('uncaughtException', (error)=>errorHandle('uncaughtException', error)); //Catch uncaughtExceptions
process.on('unhandledRejection', (error)=>errorHandle('unhandledRejection', error)); //Catch unhandledRejections

process.on('exit', (code)=>shudownHandle("exit", code)); //Global closing, this will be the LAST executed thing
process.on('SIGINT', (code)=>shudownHandle("SIGINT", code)); //Catch CTRL + C in console (already catched by TobyBot.Console, but keep it as a fallback)
process.on('SIGUSR1', (code)=>shudownHandle("SIGUSR1", code)); //Catch 'PID kills'
process.on('SIGUSR2', (code)=>shudownHandle("SIGUSR2", code)); //Catch 'PID kills'

async function errorHandle(type, error) {
    MainLog.log(`Catched an ${type}:`);
    console.log(error);
    if (!GlobalBot.catchErrorsPreventClose)await GlobalBot.shutdown(type, error);
}

async function shudownHandle(type, code) {
    if (type != "exit"){
        MainLog.log(`Recived an ${type}:`);
        console.log(code);
        await GlobalBot.shutdown(type, code);
    }
}