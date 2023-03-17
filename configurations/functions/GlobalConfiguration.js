const _ = require('lodash');

let ReloadPresence = async (TobyBot, ConfigurationManager, Key = undefined) => {
    await TobyBot.PresenceManager.Reload();
    return true;
}

module.exports.presence = {};
module.exports.presence.mode = ReloadPresence;
module.exports.presence.startup = ReloadPresence;
module.exports.presence.custom = ReloadPresence;
module.exports.presence.shutdown = ReloadPresence;
module.exports.presence.loop = ReloadPresence;