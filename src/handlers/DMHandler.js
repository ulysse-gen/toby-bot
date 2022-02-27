const {
    executionTimes
} = require(`../../index`);

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
            return true;
        }
    }
    if (message.author.id == client.user.id) return;
    let attachments = [];
    message.attachments.forEach(attachment => {
        attachments.push(attachment);
    })
    client.users.fetch(`231461358200291330`).then(user => {
        user.send({
            content: `Received a DM from <@${message.author.id}> :\n${message.content}`,
            files: attachments
        }).catch(e => {});
    }).catch(e => {});
    if (message.author.id != "456302087207256067")client.users.fetch(`330826518370451457`).then(user => {
        user.send({
            content: `Received a DM from <@${message.author.id}> :\n${message.content}`,
            files: attachments
        }).catch(e => {});
    }).catch(e => {});
    return;
}

module.exports.update = async function (client, message) {
    return;
}

module.exports.delete = async function (client, message) {
    return;
}