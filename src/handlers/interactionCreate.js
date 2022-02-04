//Import needs from index
const { config, Logs, Debug, CommandsLogs, client, globalCommands } = require(`../../index`);

module.exports = async function (interaction) {
    Debug.log(`Received an interaction`, `DEBUG`);
    Debug.log(`${JSON.stringify(interaction)}`, `DEBUG`);
    return false;
}