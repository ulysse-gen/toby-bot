/////////////////////////////////
//Guild is the main class for Guilds
/////////////////////////////////

//Importing NodeJS modules
const mysql = require(`mysql`);
const { I18n } = require('i18n');
const urlExists = require('url-exists');

//Importing classes
const SQLConfigurationManager = require('./SQLConfigurationManager');
const SQLPermissionManager = require('./SQLPermissionManager');
const ModerationManager = require('./ModerationManager');
const MessageManager = require('./MessageManager');
const ChannelLogger = require('./ChannelLogger');

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

        this.loggers = {};

        this.SQLPool = mysql.createPool(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'));
        
        this.initialized = false;
        this.isSetup = false;
    }

    async initialize() {
        this.ConfigurationManager = new SQLConfigurationManager(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'), 'guilds', `\`id\` = '${this.guild.id}'`, undefined, JSON.stringify(require('../../configurations/defaults/GuildConfiguration.json')));
        this.PermissionManager = new SQLPermissionManager(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'), 'guilds', `\`id\` = '${this.guild.id}'`, undefined, require('../../configurations/defaults/GuildPermissions.json'));
        this.ModerationManager = new ModerationManager(this);
        await this.ConfigurationManager.initialize(true, this);
        this.isSetup = this.ConfigurationManager.get('system.setup-done');
        await this.PermissionManager.initialize(true, this);
        await this.initLoggers();
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

    async initLoggers(){
        for (const logger in this.ConfigurationManager.get('logging')) {
            this.loggers[logger] = new ChannelLogger(this, this.ConfigurationManager.get(`logging.${logger}`));
            await this.loggers[logger].initialize();
        }
        return true;
    }

    async getUserFromArg(userString) {
        let user = await this.guild.members.fetch({
            cache: false,
            force: true
        }).then(members => members.find(member => member.user.tag === userString));
        if (userString.startsWith('<@'))userString = userString.replace('<@', '').slice(0, -1);
        if (typeof user == "undefined") user = await this.guild.members.fetch(userString, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        return user;
    }

    async getMemberById(userId) {
        return this.guild.members.fetch(userId, {
            cache: false,
            force: true
        }).catch(e => undefined);
    }

    async getChannelById(channelId) {
        return this.guild.channels.fetch(channelId, {
            cache: false,
            force: true
        }).catch(e => undefined);
    }

    async getRoleById(roleId) {
        return this.guild.roles.fetch(roleId, {
            cache: false,
            force: true
        }).catch(e => undefined);
    }

    async autoReMute(User) {
        let MuteRole = await this.getRoleById(this.ConfigurationManager.get('moderation.muteRole'));
        if (typeof MuteRole == "undefined" || MuteRole == null) return false;
        return User.roles.add(MuteRole, this.i18n.__("moderation.auditLog.autoRemute")).then(()=>true).catch(()=>false);
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

    async getUserPfp(user, publicOnly = false) {
        if (typeof user == "undefined" || (typeof user.user.avatar == "undefined" && typeof user.avatar == "undefined")) return `https://tobybot.ubd.ovh/assets/imgs/default_discord_avatar.png`;
        return new Promise((res, _rej) => {
            let urlBase = (user.avatar != null && !publicOnly) ? `https://cdn.discordapp.com/guilds/${user.guild.id}/users/${user.user.id}/avatars/${user.avatar}` : `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}`;
            urlExists(`${urlBase}.gif`, function (_err, exists) {
                res((exists) ? `${urlBase}.gif` : `${urlBase}.webp`);
            });
        });
    }
}