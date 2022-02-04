const colors = require(`colors`);

//Import needs from index
const { configuration, client, MainLog } = require(`../../index`);

module.exports = async function () {
    let currentPresence = 0;
    MainLog.log(`Starting presence manager, loop mode : ${(configuration.presence.loop) ? `true`.green : `false`.red}.`)

    client.user.setPresence(configuration.presence.defaultPresence);

    setInterval(() => {
        if (configuration.presence.loop == false)return;
        currentPresence = (currentPresence >= (configuration.presence.loopPresences.length-1)) ? 0 : currentPresence+1;
        try {
            client.user.setPresence(configuration.presence.loopPresences[currentPresence]);
        } catch (e) {
            MainLog.log(`[ERROR] Could not update presence [${JSON.stringify(e)}][${JSON.stringify(configuration.presence.loopPresences[currentPresence])}] (${currentPresence}/${configuration.presence.loopPresences.length})`.red)
        }
    }, configuration.presence.loopTime);
}