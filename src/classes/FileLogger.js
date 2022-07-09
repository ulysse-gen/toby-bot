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
    constructor(logFile = `main.log`) {
        super();
        
        if (typeof logFile != "string" || logFile.replaceAll(' ', '') == "") throw new Error('LogFile must be a non empty string.');

        this.file = `/data/logs/${logFile}`;

        this.createPath(this.file);
    }

    async createPath(path) {
        let pathParts = path.replace('/data/', '').split('/').filter(v => v != "").slice(0,-1);
        let currentPath = '/data';
        if (pathParts.length == 0)return true;
        return new Promise((res, rej) => {
            while (pathParts.length > 0){
                currentPath += `/${pathParts.shift()}`;
                if (!fs.existsSync(currentPath)) fs.mkdirSync(currentPath);
                if (pathParts.length <= 0)res(true);
            } 
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
        this.createPath(this.file);
        if (typeof string != "string" && string == "") return false;
        fs.appendFile(this.file, colors.stripColors(`${string}\r\n`), function (err) {
            if (err) throw err;
        });
        return true;
    }
}