/////////////////////////////////
//MessageManager is the main calss to handle message saving
/////////////////////////////////

module.exports = class Metric {
    constructor(Guild) {
        this.Guild = Guild;

        this.maxMessagesStoredByUser = 50;

        this.messages = {
            byUser: {}
        };
    }

    getLastMessagesByUser(userId) {
        return this.messages.byUser[message.author.id];
    }

    async addMessage(message) {
        let MessageEntry = {
            id: `${message.channel.guild.id}-${message.channel.id}-${message.id}`,
            message: message,
            history: []
        };
        if (typeof this.messages.byUser[message.author.id] == "undefined")this.messages.byUser[message.author.id] = [];
        this.messages.byUser[message.author.id].push(MessageEntry);
        if (this.messages.byUser[message.author.id].length >= this.maxMessagesStoredByUser) guild.lastMessages[message.author.id].splice(this.maxMessagesStoredByUser-1, this.messages.byUser[message.author.id] - this.maxMessagesStoredByUser);
        return true;
    }
}