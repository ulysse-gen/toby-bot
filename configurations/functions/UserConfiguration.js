const _ = require('lodash');

let PossibleLocales = [
    "followGuild",
    "en-US",
    //"fr-FR"
]

module.exports.locale = async (TobyBot, ConfigurationManager, Key = undefined) => {
    //This execute in the context of a manual configuration chang through a command
    let localeDefined = ConfigurationManager.get(Key);

    if (typeof localeDefined != "string")return {status: false, title: ConfigurationManager.i18n.__('configuration.locale.isNotString.title'), description: ConfigurationManager.i18n.__('configuration.locale.isNotString.description', {key: Key, localeDefined: localeDefined})};
    if (!PossibleLocales.includes(localeDefined))return {status: false, title: ConfigurationManager.i18n.__('configuration.locale.notPossibleLocale.title'), description: ConfigurationManager.i18n.__('configuration.locale.notPossibleLocale.description', {key: Key, localeDefined: localeDefined, possibleLocales: `\`${PossibleLocales.join('`, `')}\``})};
    return true;
};

function isInArray(value, array) {
    return array.indexOf(value) > -1;
  }