/////////////////////////////////
//FileLogger is the main class for logs, main utility is to log in the console as well as a specified file
/////////////////////////////////

//Importing NodeJS Modules
const moment = require('moment');
const colors = require('colors');
const fs = require('fs');

//Importing Classes
const Logger = require('./Logger');
const {ErrorBuilder} = require('./Errors')

module.exports = class FileLogger extends Logger {
    constructor(logFile = `main.log`) {
        super();
        
        if (typeof logFile != "string" || logFile.replaceAll(' ', '') == "") throw new ErrorBuilder('LogFile must be a non empty string').logError();

        this.file = (logFile.startsWith('/')) ? logFile : `/data/logs/${logFile}`;

        this.createPath(this.file);
    }

    async createPath(path) {
        let pathParts = path.replace('/data/', '').split('/').filter(v => v != "").slice(0,-1);
        let currentPath = '/data';
        if (pathParts.length == 0)return true;
        return new Promise((res, _rej) => {
            while (pathParts.length > 0){
                currentPath += `/${pathParts.shift()}`;
                if (!fs.existsSync(currentPath)) try {
                    fs.mkdirSync(currentPath);
                    if (pathParts.length <= 0)res(true);
                } catch(e) {
                    throw new ErrorBuilder(`Could not build path.`, {cause: e}).setType('FILE_ERROR').logError();
                }
            } 
        });
    }

    async log(string) {
        let logText = this.pattern.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`DD/MM/YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss:SSS`));
        this.consoleLog(logText);
        this.fileLog(logText);
        return true;
    }

    fileLog(string) {
        this.createPath(this.file);
        fs.appendFile(this.file, colors.stripColors(`${string}\r\n`), function (err) {
            if (err) throw err;
        });
        return true;
    }
}