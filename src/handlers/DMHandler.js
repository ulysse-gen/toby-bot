module.exports.create = async function (client, message) {
    if (message.content.startsWith('dm!') && message.author.id == "231461358200291330") {
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
    client.users.fetch(`231461358200291330`).then(user => {
        let attachments = [];
        message.attachments.forEach(attachment => {
            attachments.push(attachment);
        })
        user.send({
            content: `Received a DM from <@${message.author.id}> :\n${message.content}`,
            files: attachments
        });
    })
    return;
}

module.exports.update = async function (client, message) {
    return;
}

module.exports.delete = async function (client, message) {
    return;
}