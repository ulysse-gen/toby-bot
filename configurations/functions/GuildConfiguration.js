const { Permissions } = require('discord.js');
const _ = require('lodash');

let loggingWithChannelDefault = {
    inChannel: async (TobyBot, ConfigurationManager, Key = undefined) => {
        //This execute in the context of a manual configuration chang through a command
        let OtherKey = Key.split('.');
        OtherKey.pop();
        let LoggerName = _.last(OtherKey);
        let LoggerConfig = ConfigurationManager.get(OtherKey.join('.'));
        OtherKey = OtherKey.join('.') + '.channel';
        let channelDefined = ConfigurationManager.get(OtherKey);
        if (typeof channelDefined != "string" || channelDefined == "none")return {status: false, title: ConfigurationManager.i18n.__('configuration.logging.enablingWithoutChannel.title'), description: ConfigurationManager.i18n.__('configuration.logging.enablingWithoutChannel.description', {key: Key, otherKey: OtherKey})};
        let InitLogger = await ConfigurationManager.Dependency.initLogger(LoggerName, LoggerConfig);
        if (typeof InitLogger != "boolean" || !InitLogger)return {status: false, title: ConfigurationManager.i18n.__('configuration.logging.couldNotInitLogger.title'), description: ConfigurationManager.i18n.__('configuration.logging.couldNotInitLogger.description', {key: Key, otherKey: OtherKey})};
        return true;
    },
    channel: async (TobyBot, ConfigurationManager, Key = undefined) => {
        //This execute in the context of a manual configuration chang through a command
        let OtherKey = Key.split('.');
        OtherKey.pop();
        OtherKey = OtherKey.join('.') + '.inChannel';

        let ChannelID = ConfigurationManager.get(Key);
        let Channel = await ConfigurationManager.Dependency.getChannelById(ChannelID);
        if (typeof Channel == "undefined" || Channel == null)return {status: false, title: ConfigurationManager.i18n.__('configuration.logging.cannotFetchChannel.title'), description: ConfigurationManager.i18n.__('configuration.logging.cannotFetchChannel.description', {key: Key, otherKey: OtherKey, channelId: ChannelID})};
        let CanSend = await Channel.permissionsFor(TobyBot.client.user.id).has(Permissions.FLAGS.SEND_MESSAGES);
        if (typeof CanSend != "boolean" || !CanSend)return {status: false, title: ConfigurationManager.i18n.__('configuration.logging.noChannelPermission.title'), description: ConfigurationManager.i18n.__('configuration.logging.noChannelPermission.description', {key: Key, otherKey: OtherKey, channelId: ChannelID})};

        let enabled = ConfigurationManager.get(OtherKey);
        if (typeof enabled != "boolean" || enabled == false)return {status: null, title: ConfigurationManager.i18n.__('configuration.logging.settingWhileChannelDisabled.title'), description: ConfigurationManager.i18n.__('configuration.logging.settingWhileChannelDisabled.description', {key: Key, otherKey: OtherKey, channelId: ChannelID})};
        return true;
    }
}

let roleDefault = async (TobyBot, ConfigurationManager, Key = undefined) => {
    //This execute in the context of a manual configuration chang through a command
    let roleId = ConfigurationManager.get(Key);
    let Role = await ConfigurationManager.Dependency.getRoleById(roleId);
    if (typeof Role == "undefined" || Role == null)return {status: false, title: ConfigurationManager.i18n.__('configuration.role.cannotFetchRole.title'), description: ConfigurationManager.i18n.__('configuration.role.cannotFetchRole.description', {key: Key, roleId: roleId})};
    return true;
}

module.exports.logging = {};
module.exports.logging.commandExecution = loggingWithChannelDefault;
module.exports.logging.moderationLogs = loggingWithChannelDefault;
module.exports.logging.autoModerationLogs = loggingWithChannelDefault;


module.exports.moderation = {};
module.exports.moderation.muteRole = roleDefault;