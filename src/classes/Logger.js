const colors = require("colors");
const fs = require('fs');
const moment = require('moment');

module.exports =  class Logger {
    constructor (logFile = `./logs/main.log`) {
        this.pattern = "[&{DATE} - &{HOUR}] &{TEXT}";
        this.logFile = (logFile.startsWith('./')) ? `${process.cwd()}/${logFile.replace('./', '')}` : logFile;

        this.logCheckUp();
    }

    logCheckUp() {
        if (!fs.existsSync(`${process.cwd()}/logs`))fs.mkdirSync(`${process.cwd()}/logs`);
        if (!fs.existsSync(this.logFile))fs.appendFile(this.logFile, "", function (err) {if (err) throw err;});
    }

    async log(string) {
        if (typeof string != "string" && string == "")return false;
        let logText = this.pattern.replace(`&{TEXT}`, `${string}`).replace(`&{DATE}`, moment().format(`DD/MM/YYYY`)).replace(`&{HOUR}`, moment().format(`HH:mm:ss`));
        this.consoleLog(logText);
        this.fileLog(logText);
        return true;
    }

    consoleLog(string) {
        if (typeof string != "string" && string == "")return false;
        console.log(string);
        return true;
    }

    fileLog(string){
        this.logCheckUp();
        if (typeof string != "string" && string == "")return false;
        fs.appendFile(this.logFile, colors.stripColors(`${string}\r\n`), function (err) {if (err) throw err;});
        return true;
    }

    emptyLogFile(textToLog = undefined) {
        this.logCheckUp();
        try {fs.writeFileSync(this.logFile, ``)} catch (err) {console.error(err);}
        if (typeof textToLog !== "undefined" && typeof textToLog === "string")this.log(`${textToLog}`, `MAIN`, `file`);
        return true;
    }
}