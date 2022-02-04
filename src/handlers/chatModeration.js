const {
    MessageEmbed
} = require(`discord.js`);
const colors = require(`colors`);

const {
    client,
    configuration,
    MainLog,
    MainSQLLog,
    globalPermissions,
} = require(`../../index`);

const utils = require(`../utils`);

module.exports = async function (message, guild = undefined) {
    let messageParts = message.content.split(' ');

    /*let permissionToCheck = `chat.links`;
    let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasGuildPermission = await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
    let hasPermission = (hasGlobalPermission == null) ? hasGuildPermission : hasGlobalPermission;
    if (hasPermission == false) console.log(`Should delete and log message because link is not allowed.`)*/
}