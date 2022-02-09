module.exports.create = async function (client, message) {
    if (message.author.id == client.user.id)return;
    client.users.fetch(`231461358200291330`).then(user => {
        let attachments = [];
        message.attachments.forEach(attachment => {
            attachments.push(attachment);
        })
        user.send({content:`Received a DM from <@${message.author.id}> :\n${message.content}`,files:attachments});
    })
    return;
}

module.exports.update = async function (client, message) {
    return;
}

module.exports.delete = async function (client, message) {
    return;
}