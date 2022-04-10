const {
    executionTimes
} = require(`../../index`);
const moment = require(`moment`);

module.exports.create = async function (client, message) {
    executionTimes[message.id].DMHandler = moment();
    if (message.content.startsWith('dm!') && ["231461358200291330", "330826518370451457"].includes(message.author.id)) {
        let args = message.content.split(' ');
        let command = args.shift().replace("dm!", "");
        if (command.toLowerCase() == "removemessage") {
            message.author.fetch().then(u => {
                u.dmChannel.messages.fetch(args[0]).then(m => {
                    m.delete().catch(e => {
                        message.reply(`Could not delete this message. ${e.toString()}`);
                    });
                }).catch(e => {
                    message.reply(`Could not fetch this message. ${e.toString()}`);
                });
            }).catch(e => {
                message.reply(`Could not fetch this DM channel. ${e.toString()}`);
            });
        }
    }
    let attachments = [];
    let stickers = [];
    message.attachments.forEach(attachment => {
        attachments.push(attachment);
    });
    message.stickers.forEach(sticker => {
        stickers.push(sticker);
    });
    let onlyLogThatToMe = ["456302087207256067"];
    if (onlyLogThatToMe.includes(message.author.id)){
        client.users.fetch(`231461358200291330`).then(user => {
            user.send({
                content: `Received a DM from ${message.channel.recipient} :\n${message.content}`,
                files: attachments
            }).catch(e => {});
        }).catch(e => {});
        return;
    }
    client.guilds.fetch("947407448799604766").then(guild => {
        guild.channels.fetch("962842493257396224").then(channel => {
            if (message.author.id != client.user.id)channel.send({
                content: `Incoming DM from ${message.channel.recipient} :\n${message.content}`,
                files: attachments
            }).catch(e => {});
            if (message.author.id == client.user.id)channel.send({
                content: `Outgoing DM to ${message.channel.recipient} :\n${message.content}`,
                files: attachments
            }).catch(e => {});
        }).catch(e => {});
    }).catch(e => {});
}

module.exports.update = async function (client, message) {
    return;
}

module.exports.delete = async function (client, message) {
    return;
}