/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules
const colors = require('colors');

//Importing classes
const FileLogger = require('../classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = {
    name: 'ready',
    once: true,
    async exec(TobyBot, client) {
        if (typeof TobyBot == "undefined")throw `${__filename}: TobyBot is undefined.`;
        MainLog.log(TobyBot.i18n.__('bot.login', {tag: colors.green(client.user.tag), appName: TobyBot.ConfigurationManager.get('appName').green, version: TobyBot.PackageInformations.version.green}));
        TobyBot.SQLLogger.logReadyState(TobyBot);
        return true;
    }
}