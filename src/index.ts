/////////////////////////////////////
// Toby Bot - Discord Utility Bot  //
// Project idea from holidae#8454  //
//     and UlysseGenie#9555        //
// Developped by UlysseGenie#9555  //
//     Thanks to Tobias Dray's     //
//Discord Server for the playground//
/////////////////////////////////////

//Importing NodeJS modules
import { I18n } from 'i18n';

//Importing classes
import FileLogger from "./classes/FileLogger";
import TobyBot from "./classes/TobyBot";

//Creating main variables
import PackageInformations from "../package.json";
import { FatalError } from './classes/Errors';
const MainLog = new FileLogger();
const ErrorLog = new FileLogger(`error.log`);
const LocaleLog = new FileLogger(`locale.log`);

//Creating main objects
const i18n = new I18n({
    locales: ['en-US','fr-FR'],
    directory: 'locales/backend',
    defaultLocale: 'en-US',
    autoReload: true,
    missingKeyFn: (locale: string, value: string) => {
        LocaleLog.log('[Missing Locale][backend]' + value + ` in ` + locale);
        return value;
    },
    objectNotation: true
});

const GlobalBot = new TobyBot(i18n, PackageInformations); //This is the bot

GlobalBot.start().catch((e: Error) => {
    throw new FatalError(`Failed to start TobyBot`, {cause: e}).logError();
});

//More debug stuff

process.stdin.resume();

process.on('uncaughtException', (error)=>errorHandle('uncaughtException', error)); //Catch uncaughtExceptions
process.on('unhandledRejection', (error)=>errorHandle('unhandledRejection', error)); //Catch unhandledRejections

process.on('exit', (code)=>shudownHandle("exit", code)); //Global closing, this will be the LAST executed thing
process.on('SIGINT', (code)=>shudownHandle("SIGINT", code)); //Catch CTRL + C in console (already caught by TobyBot.Console, but keep it as a fallback)
process.on('SIGUSR1', (code)=>shudownHandle("SIGUSR1", code)); //Catch 'PID kills'
process.on('SIGUSR2', (code)=>shudownHandle("SIGUSR2", code)); //Catch 'PID kills'
process.on('SIGTERM', (code)=>shudownHandle("SIGTERM", code)); //Catch 'Docker' ? kills

async function errorHandle(type: string, error: Error | unknown) {
    console.log(error);
    if (!GlobalBot.catchErrorsPreventClose)await GlobalBot.shutdown(type, error.toString());
}

async function shudownHandle(type: string, code: string | number) {
    if (type != "exit"){
        MainLog.log(`Recived an ${type}:`);
        console.log(code);
        await GlobalBot.shutdown(type, code.toString());
    }
}