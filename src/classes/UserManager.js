/////////////////////////////////
//UserManager is the main class for Users Management
/////////////////////////////////

//Importing classes
const User = require('./User');

module.exports = class UserManager {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;
        this.SQLPool = TobyBot.SQLPool;

        this.users = {};
    }

    async initialize() {
        return this.loadSQLContent();
    }

    async isSameUser(user1, user2){
        if (typeof user1.user != "object" || typeof user2.user != "object")return false;
        if (user1.user.id != user2.user.id)return false;
        if (user1.user.createdTimestamp != user2.user.createdTimestamp)return false;
        return true;
    }

    async loadSQLContent() {
        return new Promise((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`users\``, (error, results) => {
                if (error)throw error;
                if (results.length != 0)results.forEach(async indUser => this.getUserById(indUser.id));
                res(true);
            });
        });
    }

    async getUserById(userId, createIfNonExistant = false) {
        if (typeof this.users[userId] != "undefined")return this.users[userId];
        let user = await this.TobyBot.client.users.fetch(userId, {
            force: true
        }).catch(e=>undefined)
        if (typeof user == "undefined")return undefined;
        this.users[userId] = new User(this, user);
        await this.users[userId].initialize(createIfNonExistant).catch(e => { 
            delete this.users[userId];
            throw e;
         });
        return this.users[userId];
    }

    async getUser(user, createIfNonExistant = false) {
        if (typeof this.users[user.id] == "object" && typeof this.users[user.id].User != "undefined") return this.users[user.id];
        this.users[user.id] = new User(this, user);
        await this.users[user.id].initialize(createIfNonExistant).catch(e => { 
            delete this.users[user.id];
            throw e;
         });
        return this.users[user.id];
    }
}