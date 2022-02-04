//Import needs from index
const { config, Logs, Debug, client } = require(`../../index`);

module.exports = async function (error) {
    Debug.log(`Received an error`, `DEBUG`);
    Debug.log(`${JSON.stringify(error)}`, `DEBUG`);
    return false;
}