/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
const readline = require(`readline`);

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = class Consle {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        this.rl.on('line', this.readConsoleInput);
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
}