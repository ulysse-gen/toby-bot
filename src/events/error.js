/////////////////////////////////
//error event handler
/////////////////////////////////

//Importing classes
const FileLogger = require('../classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = {
    name: 'error',
    once: false,
    async exec(TobyBot, code) {
        if (typeof TobyBot == "undefined")throw `${__filename}(): TobyBot is undefined.`;
        MainLog.error(TobyBot.i18n.__('bot.discordjs.error', {error: code.toString()}));
        return true;
    }
}