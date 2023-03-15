const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const axios = require('axios').default;
const jwt    = require('jsonwebtoken');
const _    = require('lodash');
const { ErrorBuilder } = require('/app/src/classes/Errors');
const FileConfigurationManager = require('/app/src/classes/FileConfigurationManager');


exports.getMine = async (req, res, next) => {
    req.params.userId = req.User.id;
    next();
}

exports.getUserById = async (req, res, next) => {
    const { userId } = req.params;

    if (!userId)return res.status(400).json(req.__('error.required', {required: 'userId'}));

    try {
        let User = await req.API.TobyBot.UserManager.getUserById(userId);

        if (User) {
            return res.status(200).json(User.apiVersion());
        } else {
            return res.status(404).json(req.__('error.user_not_found'));
        }
    } catch (error) {
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.getUserConfiguration = async (req, res, next) => {
    const { userId } = req.params;

    if (!userId)return res.status(400).json(req.__('error.required', {required: 'userId'}));

    try {
        let User = await req.API.TobyBot.UserManager.getUserById(userId);

        if (User) {
            return res.status(200).json(_.omit(User.ConfigurationManager.configuration, ['system']));
        } else {
            return res.status(404).json(req.__('error.user_not_found'));
        }
    } catch (error) {
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.getUserConfigurationKey = async (req, res, next) => {
    const { userId, configurationKey } = req.params;

    if (!userId)return res.status(400).json(req.__('error.required', {required: 'userId'}));
    if (!configurationKey)return res.status(400).json(req.__('error.required', {required: 'configurationKey'}));

    try {
        let User = await req.API.TobyBot.UserManager.getUserById(userId);
        if (!User)return res.status(404).json(req.__('error.user_not_found'));

        let ConfigurationManager = User.ConfigurationManager;
        let ConfigurationDocumentation = new FileConfigurationManager('/app/configurations/documentations/UserConfiguration.json', undefined, true);
        let ConfigurationFunctions = require('/app/configurations/functions/UserConfiguration');
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
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.patchConfigurationKey = async (req, res, next) => {
    const { userId, configurationKey } = req.params;

    const { value } = req.body;

    if (!userId)return res.status(400).json(req.__('error.required', {required: 'userId'}));
    if (!configurationKey)return res.status(400).json(req.__('error.required', {required: 'configurationKey'}));
    if (!value)return res.status(400).json(req.__('error.required', {required: 'value'}));

    try {
        let User = await req.API.TobyBot.UserManager.getUserById(userId);
        if (!User)return res.status(404).json(req.__('error.user_not_found'));

        let ConfigurationManager = User.ConfigurationManager;
        let ConfigurationDocumentation = new FileConfigurationManager('/app/configurations/documentations/UserConfiguration.json', undefined, true);
        let ConfigurationFunctions = require('/app/configurations/functions/UserConfiguration');
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
                return res.status(400).json(req.__('error.cannot_parse_json'));
            }
        }else if (["Integer"].includes(KeyType)){
            try {
                KeyNewValue = parseInt(KeyNewValue);
            }catch (e) {
                return res.status(400).json(req.__('error.cannot_parse_int'));
            }
        }else if (["Float"].includes(KeyType)){
            try {
                KeyNewValue = parseFloat(KeyNewValue);
            }catch (e) {
                return res.status(400).json(req.__('error.cannot_parse_float'));
            }
        }else if (["Boolean"].includes(KeyType)){
            if (["true","1","yes","y","oui","o"].includes(KeyNewValue)){
                KeyNewValue = true;
            }else if (["false","0","no","n","non"].includes(KeyNewValue)) {
                KeyNewValue = false;
            } else {
                return res.status(400).json(req.__('error.cannot_parse_boolean'));
            }
        }else {
            return res.status(400).json(req.__('error.config_check_not_defined'));
        }

        if (KeyType.startsWith('Object')) {
            if (_.isEqual(KeyValue, KeyNewValue))return res.status(200).json({error: null, title: req.__('error.configuration_unchanged'), before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});
        } else if (KeyValue == KeyNewValue)return res.status(200).json({error: null, title: req.__('error.configuration_unchanged'), before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});

        await ConfigurationManager.set(configurationKey, KeyNewValue);

        if (typeof _.get(ConfigurationFunctions, configurationKey) == "function"){
            let updateFunction = await _.get(ConfigurationFunctions, configurationKey)(req.API.TobyBot, ConfigurationManager, configurationKey);
            if (typeof updateFunction == "object") {
                if (typeof updateFunction.status == "boolean" && updateFunction.status == false){
                    ConfigurationManager.set(configurationKey, KeyValue);
                    return res.status(400).json({error: true, title: updateFunction.title, text: (typeof updateFunction.description == "string") ? updateFunction.description : undefined, extra: (typeof updateFunction.fields == "object") ? updateFunction.fields : undefined, before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});
                }
                //if (typeof updateFunction.status == "object" && updateFunction.status == null)CommandExecution.replyWarningEmbed({ephemeral: null}, updateFunction.title, (typeof updateFunction.description == "string") ? updateFunction.description : undefined, (typeof updateFunction.fields == "object") ? updateFunction.fields : undefined);
            }
        }

        return res.status(200).json({before: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyValue }, after: { name: KeyName, description: KeyDescription, type: KeyType, defaultValue: KeyDefaultValue, value: KeyNewValue }});
    } catch (error) {
        console.log(error)
        return res.status(500).json(req.__('error.unknown'));
    }
}




exports.genToken = async (req, res, next) => {
    const { password } = req.body;

    if (!password)return res.status(400).json(req.__('error.required', {required: 'password'}));

    try {
        res.status(200).json(bcrypt.hashSync(password, 10));
    } catch (error) {
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.auth = async (req, res, next) => {
    const { userId, password } = req.body;

    if (!userId)return res.status(401).json(req.__('error.required', {required: 'userId'}));
    if (!password)return res.status(401).json(req.__('error.required', {required: 'password'}));

    try {
        let User = await req.API.TobyBot.UserManager.getUserById(userId);

        if (User) {
            if (!User.password)return res.status(418).json(req.__('error.no_api_account'));

            bcrypt.compare(password, User.password, function(err, response) {
                if (err) throw new ErrorBuilder(`Could not verify password`, {cause: err}).logError();
                if (response) {
                    User = User.tokenVersion();

                    const expireIn = 24 * 60 * 60;
                    const token    = jwt.sign({
                        tokenIdentifier: crypto.randomBytes(8).toString('hex'),
                        User: User
                    },
                    req.API.secret,
                    {
                        expiresIn: expireIn
                    });

                    res.header('Authorization', 'Bearer ' + token);

                    return res.status(200).json({user: User, token: {token: token, expireIn: expireIn}});
                }

                return res.status(403).json(req.__('error.wrong_credentials'));
            });
        } else {
            return res.status(404).json(req.__('error.user_not_found'));
        }
    } catch (error) {
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.authAs = async (req, res, next) => {
    const { userId, validity } = req.body;

    if (!userId)return res.status(400).json(req.__('error.required', {required: 'userId'}));

    try {
        let User = await req.API.TobyBot.UserManager.getUserById(userId);

        if (User) {
            if (!User.password)return res.status(418).json(req.__('error.no_api_account'));

            User = User.tokenVersion();

            const expireIn = (validity) ? parseInt(validity) : 24 * 60 * 60;
            const token    = jwt.sign({
                tokenIdentifier: crypto.randomBytes(8).toString('hex'),
                User: User
            },
            req.API.secret,
            {
                expiresIn: expireIn
            });

            res.header('Authorization', 'Bearer ' + token);

            return res.status(200).json({user: User, token: {token: token, expireIn: expireIn}});
        } else {
            return res.status(404).json(req.__('error.user_not_found'));
        }
    } catch (error) {
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.authByTempToken = async (req, res, next) => {
    const { userId, tempToken } = req.params;

    if (!userId)return res.status(401).json(req.__('error.required', {required: 'userId'}));
    if (!tempToken)return res.status(401).json(req.__('error.required', {required: 'tempToken'}));

    try {
        User = req.User.tokenVersion();

        const expireIn = 24 * 60 * 60;
        const token    = jwt.sign({
            tokenIdentifier: crypto.randomBytes(8).toString('hex'),
            User: User
        },
        req.API.secret,
        {
            expiresIn: expireIn
        });

        res.header('Authorization', 'Bearer ' + token);

        return res.status(200).json({user: User, token: {token: token, expireIn: expireIn}});
    } catch (error) {
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.authByDiscordToken = async (req, res, next) => {
    const { discordToken } = req.body;

    if (!discordToken)return res.status(401).json(req.__('error.required', {required: 'discordToken'}));

    try {
        let discordUser = await axios({
            method: 'get',
            url: 'https://discord.com/api/users/@me',
            headers: {'Authorization': `Bearer ${discordToken}`}
        }).then(res => res.data);

        let User = await req.API.TobyBot.UserManager.getUserById(discordUser.id);

        if (User) {
            User = User.tokenVersion();

            const expireIn = 24 * 60 * 60;
            const token    = jwt.sign({
                tokenIdentifier: crypto.randomBytes(8).toString('hex'),
                User: User
            },
            req.API.secret,
            {
                expiresIn: expireIn
            });
            res.header('Authorization', 'Bearer ' + token);
            return res.status(200).json({user: User, token: {token: token, expireIn: expireIn}});
        } else {
            return res.status(404).json(req.__('error.user_not_found'));
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(req.__('error.unknown'));
    }
}

exports.authByDiscordCode = async (req, res, next) => {
    const { code, redirect_uri } = req.body;

    if (!code)return res.status(401).json(req.__('error.required', {required: 'code'}));

    try {
        const requestOptions = {
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env['VUE_APP_OAUTH2_CLIENT_ID'],
                client_secret: process.env['VUE_APP_OAUTH2_CLIENT_SECRET'],
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: (redirect_uri) ? redirect_uri : 'https://tobybot.xyz/login',
            }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          };
        let discordToken = await fetch("https://discord.com/api/oauth2/token", requestOptions).then(response =>response.json());
        let discordUser = await axios({
            method: 'get',
            url: 'https://discord.com/api/users/@me',
            headers: {'Authorization': `Bearer ${discordToken.access_token}`}
        }).then(res => res.data);

        let User = await req.API.TobyBot.UserManager.getUserById(discordUser.id);

        if (User) {
            User = User.tokenVersion();

            const expireIn = 24 * 60 * 60;
            const token    = jwt.sign({
                tokenIdentifier: crypto.randomBytes(8).toString('hex'),
                User: User
            },
            req.API.secret,
            {
                expiresIn: expireIn
            });
            res.header('Authorization', 'Bearer ' + token);
            return res.status(200).json({user: discordUser, discordToken: {access_token: discordToken.access_token, expireIn: discordToken.expires_in, refresh_token: discordToken.refresh_token}, tobybotToken: {token: token, expireIn: expireIn}});
        } else {
            return res.status(404).json(req.__('error.user_not_found'));
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(req.__('error.unknown'));
    }
}