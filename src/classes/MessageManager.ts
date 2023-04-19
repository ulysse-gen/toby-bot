/////////////////////////////////
//MessageManager is the main calss to handle message saving
/////////////////////////////////

import { Message, TextChannel } from "discord.js";
import Guild from "./Guild";
import TobyBot from "./TobyBot";
import { MessageLogEntry } from "../interfaces/main";

export default class MessageManager {
    TobyBot: TobyBot;
    Guild: Guild;
    maxMessagesStored: number;
    allMessages: MessageLogEntry[];
    constructor(Guild: Guild) {
        this.TobyBot = Guild.TobyBot;
        this.Guild = Guild;

        this.maxMessagesStored = 250;

        this.allMessages = [];
    }

    getLastMessagesByGuild(guildId, amount = 999): MessageLogEntry[] {
        return this.allMessages.filter(x=>x.guildId == guildId).splice(0, amount);
    }

    getLastMessagesByChannel(channelId, amount = 999): MessageLogEntry[] {
        return this.allMessages.filter(x=>x.channelId == channelId).splice(0, amount);
    }

    getLastMessagesByUser(userId, amount = 999): MessageLogEntry[] {
        return this.allMessages.filter(x=>x.userId == userId).splice(0, amount);
    }

    getMessageByMessageId(messageId): MessageLogEntry {
        return this.allMessages.find(x=>x.messageId == messageId);
    }

    getMessageById(messageId): MessageLogEntry {
        return this.allMessages.find(x =>x.id == messageId)
    }

    async getMessageIndexById(messageId): Promise<number> {
        return this.allMessages.findIndex(x =>x.id == messageId)
    }

    async updateMessage(oldMessage: Message, newMessage: Message): Promise<MessageLogEntry> {
        let messageToUpdate = this.getMessageById(`${(oldMessage.channel as TextChannel).guild.id}-${oldMessage.channel.id}-${oldMessage.id}`);
        if (typeof messageToUpdate == "undefined")messageToUpdate = await this.addMessage(newMessage);
        messageToUpdate.history.push(oldMessage);
        messageToUpdate.message = newMessage;
        messageToUpdate.edited = true;
        return messageToUpdate;
    }

    async deleteMessage(oldMessage: Message): Promise<MessageLogEntry> {
        let messageToUpdate = await this.getMessageById(`${(oldMessage.channel as TextChannel).guild.id}-${oldMessage.channel.id}-${oldMessage.id}`);
        if (typeof messageToUpdate == "undefined")messageToUpdate = await this.addMessage(oldMessage);
        messageToUpdate.deleted = true;
        return messageToUpdate;
    }

    async addMessage(message: Message): Promise<MessageLogEntry> {
        let MessageEntry = {
            id: `${(message.channel as TextChannel).guild.id}-${message.channel.id}-${message.id}`,
            messageId: message.id,
            channelId: message.channel.id,
            guildId: (message.channel as TextChannel).guild.id,
            userId: message.author.id,
            deleted: false,
            edited: false,
            message: message,
            history: []
        } as MessageLogEntry;
        this.allMessages.unshift(MessageEntry);
        if (this.allMessages.length >= this.maxMessagesStored) this.allMessages.splice(0, this.maxMessagesStored);
        return MessageEntry;
    }
}