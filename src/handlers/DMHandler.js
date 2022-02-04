const { config, Debug } = require("../..");

module.exports.create = async function (client, message) {
    if (message.content.startsWith(config.prefix))require(`./commandHandler`)(message, true);
    return;
}

module.exports.update = async function (client, message) {
    return;
}

module.exports.delete = async function (client, message) {
    return;
}