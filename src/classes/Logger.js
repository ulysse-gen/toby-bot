/////////////////////////////////
//Logger is the main class for logs, main utility is to log in the console with time attached
/////////////////////////////////

//Importing NodeJS Modules
const moment = require('moment');

const TobyBotErrors = require('./Errors')

module.exports = class Logger {
    constructor() {
        this.pattern = "[&{DATE} - &{HOUR}] &{TEXT}";
    }

    warning(string) {
        return this.log(string.yellow);
    }

    error(string) {
        return this.log(string.red);
    }

    async log(string) {
        let logText = this.pattern.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`DD/MM/YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss:SSS`));
        this.consoleLog(logText);
        return true;
    }

    consoleLog(string) {
        console.log(string);
        return true;
    }
}