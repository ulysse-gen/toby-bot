const _    = require('lodash');
const FileConfigurationManager = require('../../../classes/FileConfigurationManager');

exports.status = async (req, res, next) => {
    try {
        return res.status(200).json({status: 'running', uptime: parseFloat((process.uptime() * 1000).toFixed(2))});
    } catch (error) {
        return res.status(501).json(req.__('error.unknown'));
    }
}

exports.uptime = async (req, res, next) => {
    try {
        return res.status(200).json(parseFloat((process.uptime() * 1000).toFixed(2)));
    } catch (error) {
        return res.status(501).json(req.__('error.unknown'));
    }
}

exports.getConfiguration = async (req, res, next) => {
    try {
        return res.status(200).json(_.omit(req.API.TobyBot.ConfigurationManager.configuration, ['token']));
    } catch (error) {
        return res.status(401).json(req.__('error.unknown'));
    }
}

exports.getConfigurationKey = async (req, res, next) => {
    const { configurationKey } = req.params;

    if (!configurationKey)return res.status(401).json(req.__('error.required', {required: 'configurationKey'}));

    try {
        let ConfigurationManager = req.API.TobyBot.ConfigurationManager;
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/GlobalConfiguration.json');
        let ConfigurationFunctions = require('../../../../configurations/functions/GlobalConfiguration');
        await ConfigurationDocumentation.initialize();

        if (!ConfigurationManager.initialized)await ConfigurationManager.initialize(true, undefined, User)

        let KeyDocumentation = ConfigurationDocumentation.get(configurationKey);
        if (typeof KeyDocumentation != "object" || (typeof KeyDocumentation.editable != "boolean" || !KeyDocumentation.editable) || (typeof KeyDocumentation.name != "string" || typeof KeyDocumentation.description != "string" || typeof KeyDocumentation.type != "string"))return res.status(404).json(req.__('error.configuration_key_not_found'));

        let KeyName = KeyDocumentation.name;
        let KeyDescription = KeyDocumentation.description;
        let KeyType = KeyDocumentation.type;
        let KeyDefaultValue  = KeyDocumentation.default;
        let KeyValue = ConfigurationManager.get(configurationKey)

        return res.status(200).json({name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue});
    } catch (error) {
        console.log(error)
        return res.status(401).json(req.__('error.unknown'));
    }
}

exports.patchConfigurationKey = async (req, res, next) => {
    const { configurationKey } = req.params;

    const { value } = req.body;

    if (!configurationKey)return res.status(401).json(req.__('error.required', {required: 'configurationKey'}));
    if (!value)return res.status(401).json(req.__('error.required', {required: 'value'}));

    try {
        let ConfigurationManager = req.API.TobyBot.ConfigurationManager;
        let ConfigurationDocumentation = new FileConfigurationManager('documentations/GlobalConfiguration.json');
        let ConfigurationFunctions = require('../../../configurations/functions/GlobalConfiguration');
        await ConfigurationDocumentation.initialize();

        if (!ConfigurationManager.initialized)await ConfigurationManager.initialize(true, undefined, User)

        let KeyDocumentation = ConfigurationDocumentation.get(configurationKey);
        if (typeof KeyDocumentation != "object" || (typeof KeyDocumentation.editable != "boolean" || !KeyDocumentation.editable) || (typeof KeyDocumentation.name != "string" || typeof KeyDocumentation.description != "string" || typeof KeyDocumentation.type != "string"))return res.status(404).json(req.__('error.configuration_key_not_found'));

        let KeyName = KeyDocumentation.name;
        let KeyDescription = KeyDocumentation.description;
        let KeyType = KeyDocumentation.type;
        let KeyDefaultValue  = KeyDocumentation.default;
        let KeyValue = ConfigurationManager.get(configurationKey);

        let KeyNewValue = value;

        if (KeyType.startsWith('String')){
                
        }else if (KeyType.startsWith('Object')){
            KeyValue = _.cloneDeep(KeyValue);
            try {
                if (KeyNewValue.startsWith('+')) {
                    let KeyManipulating = _.cloneDeep(KeyValue);
                    KeyNewValue = KeyNewValue.replace('+', '')
                    if (KeyType == "Object(Array)"){
                        KeyManipulating.push(KeyNewValue);
                    }else if (KeyType == "Object") {
                        KeyManipulating[KeyNewValue.split(':', 2)[0]] = KeyNewValue.split(':', 2)[1];
                    }else {
                        KeyManipulating = KeyNewValue;
                    }
                    KeyNewValue = KeyManipulating;
                }else if (KeyNewValue.startsWith('-')) {
                    let KeyManipulating = _.cloneDeep(KeyValue);
                    KeyNewValue = KeyNewValue.replace('-', '')
                    if (KeyType == "Object(Array)"){
                        KeyManipulating = KeyManipulating.filter(arrayItem => arrayItem !== KeyNewValue);
                    }else if (KeyType == "Object") {
                        delete KeyManipulating[KeyNewValue.split(':', 1)[0]];
                    }else {
                        KeyManipulating = KeyNewValue;
                    }
                    KeyNewValue = KeyManipulating;
                } else {
                    KeyNewValue = JSON.parse(KeyNewValue);
                }
            }catch (e) {
                return res.status(401).json(req.__('error.cannot_parse_json'));
            }
        }else if (["Integer"].includes(KeyType)){
            try {
                KeyNewValue = parseInt(KeyNewValue);
            }catch (e) {
                return res.status(401).json(req.__('error.cannot_parse_int'));
            }
        }else if (["Float"].includes(KeyType)){
            try {
                KeyNewValue = parseFloat(KeyNewValue);
            }catch (e) {
                return res.status(401).json(req.__('error.cannot_parse_float'));
            }
        }else if (["Boolean"].includes(KeyType)){
            if (["true","1","yes","y","oui","o"].includes(KeyNewValue)){
                KeyNewValue = true;
            }else if (["false","0","no","n","non"].includes(KeyNewValue)) {
                KeyNewValue = false;
            } else {
                return res.status(401).json(req.__('error.cannot_parse_boolean'));
            }
        }else {
            return res.status(401).json(req.__('error.config_check_not_defined'));
        }

        if (KeyType.startsWith('Object')) {
            if (_.isEqual(KeyValue, KeyNewValue))return res.status(401).json({error: null, title: req.__('error.configuration_unchanged'), before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});
        } else if (KeyValue == KeyNewValue)return res.status(401).json({error: null, title: req.__('error.configuration_unchanged'), before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});

        await ConfigurationManager.set(configurationKey, KeyNewValue);

        if (typeof _.get(ConfigurationFunctions, configurationKey) == "function"){
            let updateFunction = await _.get(ConfigurationFunctions, configurationKey)(req.API.TobyBot, ConfigurationManager, configurationKey);
            if (typeof updateFunction == "object") {
                if (typeof updateFunction.status == "boolean" && updateFunction.status == false){
                    ConfigurationManager.set(configurationKey, KeyValue);
                    return res.status(401).json({error: true, title: updateFunction.title, text: (typeof updateFunction.description == "string") ? updateFunction.description : undefined, extra: (typeof updateFunction.fields == "object") ? updateFunction.fields : undefined, before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});
                }
                //if (typeof updateFunction.status == "object" && updateFunction.status == null)CommandExecution.replyWarningEmbed({ephemeral: null}, updateFunction.title, (typeof updateFunction.description == "string") ? updateFunction.description : undefined, (typeof updateFunction.fields == "object") ? updateFunction.fields : undefined);
            }
        }

        return res.status(200).json({before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});
    } catch (error) {
        console.log(error)
        return res.status(401).json(req.__('error.unknown'));
    }
}