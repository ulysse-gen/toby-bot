/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

import TobyBot from "./TobyBot";

//Importing NodeJS Modules
import readline from "readline";

//Importing classes
import FileLogger from './FileLogger';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default class Console {
    TobyBot: TobyBot;
    rl: any;
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        this.AttachEvents();
    }

    async readConsoleInput(line, lineCount, byteCount) {
        MainLog.log(`Console input: ${line}`);
        return true;
    }

    async question(query) {
        return new Promise(resolve => this.rl.question(query, ans => {
            resolve(ans);
        }));
    }

    async askForToken() {
        MainLog.log(this.TobyBot.i18n.__('bot.inputToken.question'))
        return this.question('');
    }

    async askForCommunityGuild() {
        MainLog.log(this.TobyBot.i18n.__('bot.inputCommunityGuild.question'))
        return this.question('');
    }

    async AttachEvents() {
        let _this = this;
        this.rl.on('line', this.readConsoleInput);

        this.rl.on('SIGCONT', (...args) => {
            MainLog.log(`Received SIGCONT with arguments:`);
            if (args.length != 0)console.log(args);
        });
        this.rl.on('SIGTSTP', (...args) => {
            MainLog.log(`Received SIGTSTP with arguments:`);
            if (args.length != 0)console.log(args);
        });
        
        this.rl.on('SIGINT', (...args) => {
            if (_this.TobyBot.shuttingDown)return false;
            if (args.length != 0)console.log(args);
            _this.TobyBot.shutdown('SIGINT');
        });
        
        this.rl.on('close', (...args) => {
            if (_this.TobyBot.shuttingDown)return false;
            if (args.length != 0)console.log(args);
            _this.TobyBot.shutdown('ConsoleClose');
        });
        return true;
    }
}