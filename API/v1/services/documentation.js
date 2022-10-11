const _    = require('lodash');
const FileConfigurationManager = require('../../../src/classes/FileConfigurationManager');

exports.guildConfiguration = async (req, res, next) => {
    try {
        let ConfigurationDocumentation = new FileConfigurationManager(process.cwd() + '/configurations/documentations/GuildConfiguration.json', undefined, true);
        await ConfigurationDocumentation.initialize();

        return res.status(200).json(ConfigurationDocumentation.configuration);
    } catch (error) {
        console.log(error)
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.userConfiguration = async (req, res, next) => {
    try {
        let ConfigurationDocumentation = new FileConfigurationManager(process.cwd() + '/configurations/documentations/UserConfiguration.json', undefined, true);
        await ConfigurationDocumentation.initialize();

        return res.status(200).json(ConfigurationDocumentation.configuration);
    } catch (error) {
        console.log(error)
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.globalConfiguration = async (req, res, next) => {
    try {
        let ConfigurationDocumentation = new FileConfigurationManager(process.cwd() + '/configurations/documentations/GlobalConfiguration.json', undefined, true);
        await ConfigurationDocumentation.initialize();

        return res.status(200).json(ConfigurationDocumentation.configuration);
    } catch (error) {
        console.log(error)
        return res.status(500).json(req.__('error.unknown'));
    }
}
