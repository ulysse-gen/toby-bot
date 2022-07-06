/////////////////////////////////
//MessageManager is the main calss to handle message saving
/////////////////////////////////

module.exports = class MessageManager {
    constructor(Guild) {
        this.Guild = Guild;

        this.maxMessagesStored = 250;

        this.allMessages = [];
    }

    getLastMEssagesByGuild(guildId) {
        return (this.allMessages.filter(x=>x.guildId == guildId));
    }

    getLastMEssagesByChannel(channelId) {
        return (this.allMessages.filter(x=>x.channelId == channelId));
    }

    getLastMessagesByUser(userId) {
        return (this.allMessages.filter(x=>x.userId == userId));
    }

    getMessageById(messageId) {
        return (this.allMessages.filter(x=>x.messageId == messageId));
    }

    async addMessage(message) {
        let MessageEntry = {
            id: `${message.channel.guild.id}-${message.channel.id}-${message.id}`,
            messageId: message.id,
            channelId: message.channel.id,
            guildId: message.channel.guild.id,
            userId: message.author.id,
            message: message,
            history: []
        };
        this.allMessages.unshift(MessageEntry);
        if (this.allMessages.length >= this.maxMessagesStored) this.allMessages.splice(this.maxMessagesStored-1, this.allMessages.length - this.maxMessagesStored);
        return true;
    }
}