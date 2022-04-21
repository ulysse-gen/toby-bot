const colors = require(`colors`);

//Import needs from index
const { globalConfiguration, client, MainLog, botLifeMetric } = require(`../../index`);

module.exports = async function () {
    let currentPresence = 0;
    botLifeMetric.addEntry("presenceManagerStartup");
    MainLog.log(`Starting presence manager, loop mode : ${(globalConfiguration.configuration.presence.loop) ? `true`.green : `false`.red}.`)

    client.user.setPresence(globalConfiguration.configuration.presence.defaultPresence);

    setInterval(() => {
        if (globalConfiguration.configuration.presence.loop == false)return;
        currentPresence = (currentPresence >= (globalConfiguration.configuration.presence.loopPresences.length-1)) ? 0 : currentPresence+1;
        try {
            client.user.setPresence(globalConfiguration.configuration.presence.loopPresences[currentPresence]);
        } catch (e) {
            MainLog.log(`[ERROR] Could not update presence [${JSON.stringify(e)}][${JSON.stringify(globalConfiguration.configuration.presence.loopPresences[currentPresence])}] (${currentPresence}/${globalConfiguration.configuration.presence.loopPresences.length})`.red)
        }
    }, globalConfiguration.configuration.presence.loopTime);
}