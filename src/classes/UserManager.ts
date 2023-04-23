/////////////////////////////////
//UserManager is the main class for Users Management
/////////////////////////////////

//Importing classes
import { TypeError } from './Errors';
import TobyBot from './TobyBot';
import User from './User';
import { Collection, User as DiscordUser } from 'discord.js';

export default class UserManager {
    TobyBot: TobyBot;
    SQLPool: any;
    users: Collection<string, User>;
    constructor(TobyBot: TobyBot) {
        this.TobyBot = TobyBot;
        this.SQLPool = TobyBot.SQLPool;

        this.users = new Collection<string, User>;
    }

    async initialize(): Promise<void> {
        return this.loadSQLContent();
    }

    isSameUser(user1: User, user2: User): boolean {
        if (!(user1 instanceof User && user2 instanceof User))throw new TypeError('user1 and user2 must be User.');
        if (user1.User.id != user2.User.id)return false;
        if (user1.User.createdTimestamp != user2.User.createdTimestamp)return false;
        return true;
    }

    async loadSQLContent(): Promise<void> {
        return new Promise<void>((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`users\``, (error, results) => {
                if (error)throw error;
                if (results.length != 0)results.forEach(async indUser => this.getUserById(indUser.id));
                res();
            });
        });
    }

    async getUserById(userId: string, createIfNonExistant = false): Promise<User> {
        if (this.users.has(userId))return this.users.get(userId);
        const FetchedUser: DiscordUser = await this.TobyBot.client.users.fetch(userId, {force: true}).catch(e=>undefined);
        if (!FetchedUser)return undefined;
        this.users.set(userId, new User(this, FetchedUser));
        await this.users.get(userId).initialize(createIfNonExistant).catch(e => { 
            delete this.users[userId];
            throw e;
        });
        return this.users.get(userId);
    }

    async getUser(user: DiscordUser, createIfNonExistant = false): Promise<User> {
        if (this.users.has(user.id))return this.users.get(user.id);
        this.users.set(user.id, new User(this, user));
        await this.users.get(user.id).initialize(createIfNonExistant).catch(e => { 
            delete this.users[user.id];
            throw e;
        });
        return this.users.get(user.id);
    }
}