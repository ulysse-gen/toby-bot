/////////////////////////////////
//Guild is the main class for Guilds
/////////////////////////////////

//Importing NodeJS modules
const mysql = require(`mysql`);
const { I18n } = require('i18n');
const urlExists = require('url-exists');
const { Permissions } = require('discord.js');

//Importing classes
const SQLConfigurationManager = require('./SQLConfigurationManager');
const SQLPermissionManager = require('./SQLPermissionManager');
const ModerationManager = require('./ModerationManager');
const MessageManager = require('./MessageManager');
const ChannelLogger = require('./ChannelLogger');
const FileLogger = require('./FileLogger');

const MainLog = new FileLogger();

module.exports = class Guild {
    constructor(GuildManager, guild) {
        this.GuildManager = GuildManager;

        this.guild = guild;

        this.name = guild.name;
        this.locale = 'en-US';

        this.MessageManager = new MessageManager(this);
        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/guild',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
            autoReload: true,
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

        this.SQLPool = this.GuildManager.SQLPool;
        
        this.initialized = false;
        this.isSetup = false;
    }

    async userCanManage(userId) {
        let GuildMember = await this.getMemberById(userId);
        if (!GuildMember)return false;
        return GuildMember.permissions.has(Permissions.FLAGS.MANAGE_GUILD);
    }

    apiVersion (){
        if (!this.initialized)return undefined;
        let apiVersion = {};
        apiVersion.numId = this.numId;
        apiVersion.guild = this.guild;
        apiVersion.locale = this.locale;
        apiVersion.configuration = this.ConfigurationManager.configuration;
        apiVersion.permissions = this.ConfigurationManager.permissions;
        apiVersion.isSetup = this.isSetup;
        return apiVersion;
    }

    async initialize() {
        this.ConfigurationManager = new SQLConfigurationManager(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'), 'guilds', `\`id\` = '${this.guild.id}'`, undefined, JSON.stringify(require('../../configurations/defaults/GuildConfiguration.json')));
        this.PermissionManager = new SQLPermissionManager(this.GuildManager.TobyBot.TopConfigurationManager.get('MySQL'), 'guilds', `\`id\` = '${this.guild.id}'`, undefined, require('../../configurations/defaults/GuildPermissions.json'));
        this.ModerationManager = new ModerationManager(this);
        await this.ConfigurationManager.initialize(true, this);
        this.isSetup = this.ConfigurationManager.get('system.setup-done');
        await this.PermissionManager.initialize(true, this);
        await this.initLoggers();
        await this.loadSQLContent();
        this.initialized = true;
        return true;
    }

    async loadSQLContent(checkForUpdate = false) {
        return new Promise((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`guilds\` WHERE id='${this.guild.id}'`, (error, results) => {
                if (error)throw error;
                if (results.length != 0){
                    this.numId = results[0].numId;
                    this.locale = results[0].locale;
                    this.lastUpdated = results[0].lastUpdated;
                    if (checkForUpdate && JSON.stringify(this.ConfigurationManager.configuration) != results[0].configuration)this.ConfigurationManager.load();
                    if (checkForUpdate && JSON.stringify(this.PermissionManager.permissions) != results[0].permissions)this.PermissionManager.load();
                    this.i18n.setLocale(this.locale);
                    res(true)
                }
                res(true);
            });
        });
    }

    async createInSQL() {
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

    async initLogger(loggerName, loggerConfig){
        this.loggers[loggerName] = new ChannelLogger(this, loggerConfig);
        return await this.loggers[loggerName].initialize();
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

    async getRoleFromArg(roleSrting) {
        let role = await this.guild.roles.fetch().then(roles => roles.find(role => role.name === roleSrting));
        if (roleSrting.startsWith('<@&'))roleSrting = roleSrting.replace('<@&', '').slice(0, -1);
        if (typeof role == "undefined") role = await this.guild.roles.fetch(roleSrting, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined;
        });
        return role;
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

    async getMentionnableByArg(mentionnableId) {
        let user = await this.getUserFromArg(mentionnableId);
        let role = await this.getRoleFromArg(mentionnableId);
        return (typeof user != "undefined") ? user : (typeof role != "undefined") ? role : undefined;
    }

    async getMentionnableById(mentionnableId) {
        let user = await this.getMemberById(mentionnableId);
        let role = await this.getRoleById(mentionnableId);
        return (typeof user != "undefined") ? user : (typeof role != "undefined") ? role : undefined;
    }

    async getGuildPfp() {
        return new Promise((res, rej) => {
            let baseOfUrl = `https://cdn.discordapp.com/icons/${this.guild.id}/${this.guild.icon}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });
    }

    async getGuildBanner() {
        return new Promise((res, rej) => {
            let baseOfUrl = `https://cdn.discordapp.com/banners/${this.guild.id}/${this.guild.banner}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });
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