const bcrypt   = require('bcryptjs');
const jwt    = require('jsonwebtoken');


const FileConfigurationManager = require('../../../src/classes/FileConfigurationManager');


exports.listKey = async (API, req, res, next) => {
    const { type, key } = req.params;

    try {
        let ConfigurationDocumentation = await makeConfigurationDocumentation(type);
        if (typeof ConfigurationDocumentation == "undefined")return res.status(404).json('wrong_type');

        let ConfigurationKey = ConfigurationDocumentation.get(key)

        if (typeof ConfigurationKey == "undefined")return res.status(404).json('wrong_key');
        return res.status(200).json(ConfigurationKey);
    } catch (error) {
        return res.status(501).json('error');
    }
}

exports.listType = async (API, req, res, next) => {
    const { type, key } = req.params;

    try {
        let ConfigurationDocumentation = await makeConfigurationDocumentation(type);
        if (typeof ConfigurationDocumentation == "undefined")return res.status(404).json('wrong_type');
        return res.status(200).json(ConfigurationDocumentation.configuration);
    } catch (error) {
        return res.status(501).json('error');
    }
}

async function makeConfigurationDocumentation(type) {
    if (type == "guild"){
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/GuildConfiguration.json');
        await ConfigurationDocumentation.initialize();
        return ConfigurationDocumentation;
    }
    /*if (type == "global"){
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/GlobalConfiguration.json');
        await ConfigurationDocumentation.initialize();
        return ConfigurationDocumentation;
    }*/
    if (type == "user"){
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/UserConfiguration.json');
        await ConfigurationDocumentation.initialize();
        return ConfigurationDocumentation;
    }
    return undefined;
}