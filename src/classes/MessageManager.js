/////////////////////////////////
//MessageManager is the main calss to handle message saving
/////////////////////////////////

module.exports = class MessageManager {
    constructor(Guild) {
        this.Guild = Guild;

        this.maxMessagesStored = 250;

        this.allMessages = [];
    }

    getLastMEssagesByGuild(guildId, amount = 999) {
        return this.allMessages.filter(x=>x.guildId == guildId).splice(0, amount);
    }

    getLastMEssagesByChannel(channelId, amount = 999) {
        return this.allMessages.filter(x=>x.channelId == channelId).splice(0, amount);
    }

    getLastMessagesByUser(userId, amount = 999) {
        return this.allMessages.filter(x=>x.userId == userId).splice(0, amount);
    }

    getMessageByMessageId(messageId, amount = 999) {
        return this.allMessages.filter(x=>x.messageId == messageId).splice(0, amount);
    }

    getMessageById(messageId) {
        return this.allMessages.find(x =>x.id == messageId)
    }

    async getMessageIndexById(messageId) {
        return this.allMessages.findIndex(x =>x.id == messageId)
    }

    async updateMessage(oldMessage, newMessage) {
        let messageToUpdate = this.getMessageById(`${oldMessage.channel.guild.id}-${oldMessage.channel.id}-${oldMessage.id}`);
        if (typeof messageToUpdate == "undefined")messageToUpdate = this.addMessage(newMessage);
        messageToUpdate.history.push(oldMessage);
        messageToUpdate.message = newMessage;
        messageToUpdate.edited = true;
        return messageToUpdate;
    }

    async deleteMessage(oldMessage) {
        let messageToUpdate = await this.getMessageById(`${oldMessage.channel.guild.id}-${oldMessage.channel.id}-${oldMessage.id}`);
        if (typeof messageToUpdate == "undefined")messageToUpdate = this.addMessage(oldMessage);
        messageToUpdate.deleted = true;
        return messageToUpdate;
    }

    async addMessage(message) {
        let MessageEntry = {
            id: `${message.channel.guild.id}-${message.channel.id}-${message.id}`,
            messageId: message.id,
            channelId: message.channel.id,
            guildId: message.channel.guild.id,
            userId: message.author.id,
            deleted: false,
            edited: false,
            message: message,
            history: []
        };
        this.allMessages.unshift(MessageEntry);
        if (this.allMessages.length >= this.maxMessagesStored) this.allMessages.splice(0, this.maxMessagesStored);
        return MessageEntry;
    }
}