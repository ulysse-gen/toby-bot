/////////////////////////////////
//Guild is the main class for Guilds
/////////////////////////////////

//Importing NodeJS modules
const mysql = require(`mysql`);
const { I18n } = require('i18n');

//Importing classes
const SQLConfigurationManager = require('./SQLConfigurationManager');
const SQLPermissionManager = require('./SQLPermissionManager');
const MessageManager = require('./MessageManager');

module.exports = class Guild {
    constructor(GuildManager, guild) {
        this.GuildManager = GuildManager;

        this.guild = guild;
        this.MessageManager = new MessageManager(this);
        this.i18n = new I18n({
            locales: ['en-US'],
            directory: 'locales/guild',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US'
        });

        this.waitingForMessageData = {
            say: {
                channels: {}
            },
            users: {},
            channels: {},
            any: undefined
        }

        this.SQLPool = mysql.createPool(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'));
        
        this.initialized = false;
    }

    async initialize() {
        this.ConfigurationManager = new SQLConfigurationManager(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'), 'guilds', `\`id\` = '${this.guild.id}'`, undefined, JSON.stringify(require('../../configurations/defaults/GuildConfiguration.json')));
        this.PermissionManager = new SQLPermissionManager(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'), 'guilds', `\`id\` = '${this.guild.id}'`, undefined, require('../../configurations/defaults/GuildPermissions.json'));
        await this.ConfigurationManager.initialize(true, this).catch(e => { throw e; });
        await this.PermissionManager.initialize(true, this).catch(e => { throw e; });
        this.initialized = true;
        return true;
    }

    async createGuildInSQL() {
        return new Promise((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`guilds\` WHERE id='${this.guild.id}'`, (error, results) => {
                if (error)throw error;
                if (results.length == 0){
                    this.SQLPool.query(`INSERT INTO \`guilds\` (id, name, locale, configuration, permissions) VALUES (?,?,?,?,?)`, [this.guild.id, this.guild.name, this.guild.preferredLocale, JSON.stringify(require('../../configurations/defaults/GuildConfiguration.json')), JSON.stringify(require('../../configurations/defaults/GuildPermissions.json'))], async (error, results) => {
                        if (error)throw error;
                        if (results.affectedRows != 1) throw new Error('Could not create the guild.')
                        res(true);
                    });
                }else {
                    res(true);
                }
            });
        });
    }

    async getMemberById(userId) {
        return this.guild.members.fetch(userId).catch(e => undefined);
    }

    async getChannelById(channelId) {
        return this.guild.channels.fetch(channelId).catch(e => undefined);
    }

    async waitingForMessage(message) {
        if (typeof this.waitingForMessageData.say.channels[message.channel.id] == "object" && typeof this.waitingForMessageData.say.channels[message.channel.id][message.author.id] == "function")
            return this.waitingForMessageData.say.channels[message.channel.id][message.author.id](message);

        if (typeof this.waitingForMessageData.users[message.author.id] == "object" && typeof this.waitingForMessageData.users[message.author.id].channels == "object")
            if (typeof this.waitingForMessageData.users[message.author.id].channels[message.channel.id] == "function")return this.waitingForMessageData.users[message.author.id].channels[message.channel.id](message);

        if (typeof this.waitingForMessageData.channels[message.channel.id] == "object" && typeof this.waitingForMessageData.channels[message.channel.id].users == "object")
            if (typeof this.waitingForMessageData.channels[message.channel.id].users[message.author.id] == "function")return this.waitingForMessageData.channels[message.channel.id].users[message.author.id](message);

        if (typeof this.waitingForMessageData.users[message.channel.id] == "function")return this.waitingForMessageData.users[message.author.id](message);

        if (typeof this.waitingForMessageData.channels[message.channel.id] == "function")return this.waitingForMessageData.channels[message.channel.id](message);

        if (typeof this.waitingForMessageData.any == "function")return this.waitingForMessageData.any(message);
        
        return false;
    }
}