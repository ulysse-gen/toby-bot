const cld = require('cld');
const { MainLog } = require('../../..');
const leetSpeakConverter = require('../../utils/leet-converter');

module.exports.languageDetect = async (_client, message, guild = undefined) => {
    message.customMetric.addEntry(`LanguageDetect`);
    return new Promise((res, _rej) => {
        let toCheck = [];
        let CheckPromises = [];
        toCheck.push(message.content);
        toCheck.push(leetSpeakConverter.convertInputReverse(message.content));

        toCheck.forEach(e => CheckPromises.push(cld.detect(e)));

        Promise.all(CheckPromises).then(results => {
            results = results.reduce((a, b) => {
                if (a.languages[0].name == b.languages[0].name)return (a.languages[0].percent > b.languages[0].percent) ? [a] : [b];
                return [a, b];
            });


            if (guild.configurationManager.configuration.moderation.autoModeration.modules.language.strictlyReliabe)results = results.filter(indResult => indResult.reliable);
            
            //MainLog.log(JSON.stringify(results, null, 2))
        });
        
        res({result: false});
    });
}