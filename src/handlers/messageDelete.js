const { config, Logs, Debug, client } = require(`../../index`);

module.exports = async function (message) {
    /*
        Interesting things : 
        message.channelId;
        message.guildId;
        message.id;
        message.createdTimestamp;
        message.content;
        message.authorId;
        message.type; //(DEFAULT, REPLY, APPLICATION_COMMAND)
    */

    if (config.skipChannel.includes(message.channelId) || (!dev && config.devChannel.includes(message.channelId)))return;

    if (message.guildId != null && message.author.id != client.user.id)require(`./messageLogger`).messageDelete(message);
    
    if (message.type == "APPLICATION_COMMAND" || message.author.bot || message.author.id == client.user.id)return;

    if (message.guildId == null)return require('./DMHandler').delete(client, message);
    if (message.guildId == null)require(`./messageLogger`).messageDelete(message, true);

    if (message.author.bot == true)return;
    if (message.author.id == client.user.id)return;
    Debug.log(`A message got deleted`, `DEBUG`);
    return false;
}