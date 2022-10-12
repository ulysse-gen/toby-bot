/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules
const colors = require('colors');

//Importing classes
const FileLogger = require('/app/src/classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = {
    name: 'ready',
    once: true,
    async exec(TobyBot, client) {
        MainLog.log(TobyBot.i18n.__('bot.login', {tag: colors.green(client.user.tag), appName: TobyBot.ConfigurationManager.get('appName').green, version: TobyBot.PackageInformations.version.green}));
        await TobyBot.continueStart();
        await TobyBot.SQLLogger.logReadyState(TobyBot);
        await TobyBot.client.user.setPresence({status: "online", activities: [{name: "Visual Studio Code", type: "PLAYING"}]});
        return true;
    }
}