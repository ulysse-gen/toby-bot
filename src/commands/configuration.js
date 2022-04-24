const {
    MessageEmbed
} = require(`discord.js`);
const {
    _
} = require('lodash');


const {
    globalConfiguration,
    MainLog
} = require(`../../index`);
const utils = require(`../utils`);

var settingsList = {};

module.exports = {
    name: "configuration",
    description: `Edit the configuration`,
    aliases: ["config", "conf"],
    permission: `commands.configuration`,
    category: `administration`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let fields = [
                ['**List all config entires:**', `\`${guild.configurationManager.configuration.prefix}configuration list\``, false],
                ['**Show a config entry and its current and default values:**', `\`${guild.configurationManager.configuration.prefix}configuration show <configName>\``, false],
                ['**Set the value of a configuration entry:**', `\`${guild.configurationManager.configuration.prefix}configuration set <configName> <value>\``, false],
                ['**Reset the value of a configuration entry:**', `\`${guild.configurationManager.configuration.prefix}configuration reset/unset <configName> <value>\``, false]
            ]
            return utils.sendMain(message, guild, `Help`, `Welcome to TobyBot's configuration module. You will find a use for every of the commands shown below.`, fields, true);
        }

        let defaultConfig = require(`../../configurations/default/configuration.json`);
        let configDocumentation = require(`../../configurations/default/documentation`);
        let configEntries = makeConfigEntries(defaultConfig, guild.configurationManager.configuration, configDocumentation);

        let subCommand = args.shift().toLowerCase();

        if ([`list`,`documentation`].includes(subCommand)) {
            return utils.sendMain(message, guild, `Configuration key list`, `You can reach https://tobybot.ubd.ovh/documentation/configuration?prefix=${guild.configurationManager.configuration.prefix} to have a list of all configs keys with some documentation.`, [], true);
        }

        if ([`show`,`value`,`details`].includes(subCommand)) {
            if (args.length == 0)return utils.sendError(message, guild, `No key specified.`, `Please tell me what configuration key you want to see !`, undefined, true);
            let configKey = args.shift();
            if (typeof configEntries[configKey] == "undefined")return utils.sendError(message, guild, `This config key does not exist.`, `You can reach https://tobybot.ubd.ovh/documentation/configuration?prefix=${guild.configurationManager.configuration.prefix} to have a list of all configs keys with some documentation.`, undefined, true);

            let data = {
                name: (typeof configEntries[configKey].documentation != "undefined") ? configEntries[configKey].documentation.name : configEntries[configKey].name,
                description: (typeof configEntries[configKey].documentation != "undefined") ? configEntries[configKey].documentation.description : `This config key doesnt have a description yet.`,
                defaultValue: configEntries[configKey].defaultValue,
                currentValue: configEntries[configKey].value,
                configKey: configKey,
                type: typeof configEntries[configKey].defaultValue
            }

            if (typeof data.defaultValue == "object") data.defaultValue = JSON.stringify(data.defaultValue);
            if (typeof data.currentValue == "object") data.currentValue = JSON.stringify(data.currentValue);
            if (typeof data.defaultValue == "boolean") data.defaultValue = (data.defaultValue) ? `true` : `false`;
            if (typeof data.currentValue == "boolean") data.currentValue = (data.currentValue) ? `true` : `false`;

            let fields = [];
            fields.push(["**Name**", data.name, false]);
            fields.push(["**Description**", data.description, false])
            fields.push(["**Default value**", data.defaultValue, false]);
            fields.push(["**Key**", data.configKey, false]);
            fields.push(["**Type**", data.type, false]);

            return utils.sendMain(message, guild, `Configuration key details`, data.currentValue, fields, true);
        }

        if ([`set`,`define`].includes(subCommand)) {
            if (args.length == 0)return utils.sendError(message, guild, `No key specified.`, `Please tell me what configuration key you are trying to define sir !`, undefined, true);
            if (args.length == 1)return utils.sendError(message, guild, `No value specified.`, `Please tell me what configuration value you want it to become !`, undefined, true);

            let configKey = args.shift();
            let valueToSet = args.join(' ');

            if (typeof configEntries[configKey] == "undefined")return utils.sendError(message, guild, `This config key does not exist.`, `You can reach https://tobybot.ubd.ovh/documentation/configuration?prefix=${guild.configurationManager.configuration.prefix} to have a list of all configs keys with some documentation.`, undefined, true);
            
            if (configEntries[configKey].type == "number") try {
                valueToSet = parseInt(valueToSet);
                if (isNaN(valueToSet))return utils.sendError(message, guild, `Wrong input type !`, `Could not parse the input as a ${configEntries[configKey].type}.`, undefined, true);
            } catch (e) {
                return utils.sendError(message, guild, `Wrong input type !`, `Could not parse the input as a ${configEntries[configKey].type}.`, undefined, true);
            }
            if (configEntries[configKey].type == "boolean")if (["yes","y","o","true","1",1,].includes(valueToSet.toLowerCase())){
                valueToSet = true;
            } else {
                valueToSet = false;
            }
            if (configEntries[configKey].type == "object") try {
                valueToSet = JSON.parse(valueToSet)
            } catch (e) {
                return utils.sendError(message, guild, `Wrong input type !`, `Could not parse the input as a ${configEntries[configKey].type}.`, undefined, true);
            }

            if (typeof configEntries[configKey].documentation != "undefined" && typeof configEntries[configKey].documentation.checkerFunction == "function"){
                let checkerResult = await configEntries[configKey].documentation.checkerFunction(client, message, guild, configEntries, configKey, valueToSet);
                if (typeof checkerResult == "object"){
                    if (typeof checkerResult.break == "boolean" && checkerResult.break)return utils.sendError(message, guild, checkerResult.title, checkerResult.description, undefined, true);
                    if (typeof checkerResult.newValue != "undefined" && valueToSet != checkerResult.newValue)valueToSet = checkerResult.newValue;
                }
            }

            await guild.configurationManager.set(configKey, valueToSet);

            if (typeof configEntries[configKey].documentation != "undefined" && typeof configEntries[configKey].documentation.execAfter == "function"){
                await configEntries[configKey].documentation.execAfter(client, message, guild, configEntries, configKey, valueToSet);
            }

            if (valueToSet == configEntries[configKey].value)return utils.sendSuccess(message, guild, `Configuration unchanged`, `The config key \`${configKey}\` was already defined to \`${(typeof valueToSet == "object") ? JSON.stringify(valueToSet) : valueToSet}\`.`, undefined, true);
            if (valueToSet == configEntries[configKey].defaultValue)return utils.sendSuccess(message, guild, `Configuration defined`, `The config key \`${configKey}\` has been defined to \`${(typeof valueToSet == "object") ? JSON.stringify(valueToSet) : valueToSet}\` which is the default value.`, undefined, true);
            return utils.sendSuccess(message, guild, `Configuration defined`, `The configuration key \`${configKey}\` has been defined to \`${(typeof valueToSet == "object") ? JSON.stringify(valueToSet) : valueToSet}\`.`, undefined, true);
        }

        if ([`reset`,`unset`].includes(subCommand)) {
            if (args.length == 0)return utils.sendError(message, guild, `No key specified.`, `Please tell me what configuration key you are trying to reset !`, undefined, true);
            let configKey = args.shift();
            if (typeof configEntries[configKey] == "undefined")return utils.sendError(message, guild, `This configuration key does not exist.`, `You can reach https://tobybot.ubd.ovh/documentation/configuration?prefix=${guild.configurationManager.configuration.prefix} to have a list of all configs keys with some documentation.`, undefined, true);

            if (configEntries[configKey].value == configEntries[configKey].defaultValue)return utils.sendError(message, guild, `Configuration unchanged`, `This key is already set to its default value.`, undefined, true);


            await guild.configurationManager.set(configKey, configEntries[configKey].defaultValue);
            return utils.sendSuccess(message, guild, `Configuration defined`, `The configuration key \`${configKey}\` has been redefined to its default value \`${(typeof configEntries[configKey].defaultValue == "object") ? JSON.stringify(configEntries[configKey].defaultValue) : configEntries[configKey].defaultValue}\`.`, undefined, true);
        }

        if ([`load`,`reload`].includes(subCommand)) {
            await guild.configurationManager.load();
            return utils.sendSuccess(message, guild, `Configuration reloaded`, undefined, undefined, true);
        }

        return utils.sendError(message, guild, `Unknown subcommand`, `The command you typed seems wrong. Execute \`${guild.configurationManager.configuration.prefix}configuration\` to have more infos on how the configuration module works!`, [], true); /*Updated To New Utils*/
    }
}

function makeConfigEntries(defaultConfig, currentConfig, documentation, path = []) {
    let configEntries = {};
    for (var entry in currentConfig) {
        let pathh = JSON.parse(JSON.stringify(path));
        pathh.push(entry)
        try {
            if (currentConfig[entry].constructor === Object) {
                let configThings = makeConfigEntries(defaultConfig[entry], currentConfig[entry], documentation[entry], pathh)
                for (const key in configThings) {
                    configEntries[key] = configThings[key];
                }
            } else {
                configEntries[pathh.join('.')] = {
                    type: typeof currentConfig[entry],
                    name: entry,
                    path: pathh,
                    value: currentConfig[entry],
                    defaultValue: defaultConfig[entry]
                };
                if (typeof documentation[entry] == "object")configEntries[pathh.join('.')].documentation = documentation[entry];
            }
        } catch (e) {
            console.log(`An error occured making the config entries.`);
        }
    }
    return configEntries;
}