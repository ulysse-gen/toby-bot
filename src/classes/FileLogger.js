/////////////////////////////////
//FileLogger is the main class for logs, main utility is to log in the console as well as a specified file
/////////////////////////////////

//Importing NodeJS Modules
const moment = require('moment');
const colors = require('colors');
const fs = require('fs');

//Importing Classes
const Logger = require('./Logger');

module.exports = class FileLogger extends Logger {
    constructor(logFile = `./logs/main.log`) {
        super();

        this.file = (logFile.startsWith('./')) ? `${process.cwd()}/${logFile.replace('./', '')}` : `${process.cwd()}/logs/${logFile}`;

        this.logCheckUp();
    }

    logCheckUp() {
        if (!fs.existsSync(`${process.cwd()}/logs`)) fs.mkdirSync(`${process.cwd()}/logs`);
        if (!fs.existsSync(this.file)) fs.appendFile(this.file, "", function (err) {
            if (err) throw err;
        });
    }

    async log(string) {
        if (typeof string != "string" && string == "") return false;
        let logText = this.pattern.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`DD/MM/YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss:SSS`));
        this.consoleLog(logText);
        this.fileLog(logText);
        return true;
    }

    fileLog(string) {
        this.logCheckUp();
        if (typeof string != "string" && string == "") return false;
        fs.appendFile(this.file, colors.stripColors(`${string}\r\n`), function (err) {
            if (err) throw err;
        });
        return true;
    }
}