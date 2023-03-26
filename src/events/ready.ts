/////////////////////////////////
//ready event handler
/////////////////////////////////

//Importing NodeJS Modules
import colors from 'colors';

//Importing classes
import FileLogger from '../classes/FileLogger';

//Creating objects
const MainLog = new FileLogger();

export default {
    name: 'ready',
    once: true,
    async exec(TobyBot, client) {
        MainLog.log(TobyBot.i18n.__('bot.login', {tag: colors.green(client.user.tag), appName: TobyBot.ConfigurationManager.get('appName').green, version: TobyBot.PackageInformations.version.green}));
        await TobyBot.continueStart();
        await TobyBot.SQLLogger.logReadyState(TobyBot);
        return true;
    }
}