/////////////////////////////////
//FileLogger is the main class for logs, main utility is to log in the console as well as a specified file
/////////////////////////////////

//Importing NodeJS Modules
import moment from 'moment';
import colors from 'colors';
import fs from 'fs';

//Importing Classes
import Logger from './Logger';
import { FileError, MissingArgumentError } from './Errors';

export default class FileLogger extends Logger {
    file: string;
    constructor(logFile = `main.log`) {
        super();
        
        if (typeof logFile != "string" || logFile.replaceAll(' ', '') == "") throw new MissingArgumentError('LogFile must be a non empty string', {argument: "LogFile"});

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
                    throw new FileError(`Could not build path.`, {cause: e});
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