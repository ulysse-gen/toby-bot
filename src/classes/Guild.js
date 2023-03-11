/////////////////////////////////
//Guild is the main class for Guilds
/////////////////////////////////

//Importing NodeJS modules
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
const { ErrorBuilder } = require('./Errors');

const MainLog = new FileLogger();
const LocaleLog = new FileLogger('locale.log');

module.exports = class Guild {
    constructor(GuildManager, guild) {
        this.GuildManager = GuildManager;

        this.Guild = guild;

        this.name = guild.name;
        this.locale = 'en-US';

        this.MessageManager = new MessageManager(this);
        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/guild',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
            autoReload: true,
            missingKeyFn: (locale, value) => {
                LocaleLog.log('[Missing Locale][guild]' + value + ` in ` + locale);
                return value;
            },
            objectNotation: true
        });

        this.waitingForMessageData = {
            say: {
                channels: {}
            },
            users: {},
            channels: {},
            any: undefined
        }

        this.waitingForInteractionData = {
            users: {},
            channels: {},
            any: undefined
        }

        this.data = {
            russianroulette: {
                channels: {}
            },
            roleadder: {
                queue: undefined,
                failed: [],
                success: [],
                trackerMessage: undefined,
                fetchDone: false
            }
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
        apiVersion.guild = this.Guild;
        apiVersion.locale = this.locale;
        apiVersion.configuration = this.ConfigurationManager.configuration;
        apiVersion.permissions = this.ConfigurationManager.permissions;
        apiVersion.isSetup = this.isSetup;
        return apiVersion;
    }

    async initialize() {
        this.ConfigurationManager = new SQLConfigurationManager('guilds', `\`id\` = '${this.Guild.id}'`, undefined, JSON.stringify(require('/app/configurations/defaults/GuildConfiguration.json')));
        this.PermissionManager = new SQLPermissionManager('guilds', `\`id\` = '${this.Guild.id}'`, undefined, require('/app/configurations/defaults/GuildPermissions.json'));
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
            this.SQLPool.query(`SELECT * FROM \`guilds\` WHERE id='${this.Guild.id}'`, (error, results) => {
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
            this.SQLPool.query(`SELECT * FROM \`guilds\` WHERE id='${this.Guild.id}'`, (error, results) => {
                if (error)throw error;
                if (results.length == 0){
                    this.SQLPool.query(`INSERT INTO \`guilds\` (id, name, locale, configuration, permissions) VALUES (?,?,?,?,?)`, [this.Guild.id, this.Guild.name, this.Guild.preferredLocale, JSON.stringify(require('/app/configurations/defaults/GuildConfiguration.json')), JSON.stringify(require('/app/configurations/defaults/GuildPermissions.json'))], async (error, results) => {
                        if (error)throw new ErrorBuilder(`Could not insert the guild in the database.`, {cause: error}).setType('SQL_ERROR').logError();
                        if (results.affectedRows != 1) throw new ErrorBuilder(`Could not insert the guild in the database.`).setType('SQL_ERROR').logError();
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

    async getUserFromArg(userString, fallbackUser = undefined) {
        if (!userString)return fallbackUser;
        let User = await this.Guild.members.fetch({
            force: true
        }).then(members => members.find(member => member.user.tag === userString));
        if (userString.startsWith('<@'))userString = userString.replace('<@', '').slice(0, -1);
        if (typeof User == "undefined") User = await this.Guild.members.fetch(userString, {
            force: true
        }).catch(e => {
            return fallbackUser;
        });
        return User;
    }

    async getRoleFromArg(roleSrting) {
        let role = await this.Guild.roles.fetch().then(roles => roles.find(role => role.name === roleSrting));
        if (roleSrting.startsWith('<@&'))roleSrting = roleSrting.replace('<@&', '').slice(0, -1);
        if (typeof role == "undefined") role = await this.Guild.roles.fetch(roleSrting, {
            force: true
        }).catch(e => {
            return undefined;
        });
        return role;
    }

    async getMemberById(userId) {
        return this.Guild.members.fetch(userId, {
            force: true
        }).catch(e => undefined);
    }

    async getChannelById(channelId) {
        return this.Guild.channels.fetch(channelId, {
            force: true
        }).catch(e => undefined);
    }

    async getRoleById(roleId) {
        return this.Guild.roles.fetch(roleId, {
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
            let baseOfUrl = `https://cdn.discordapp.com/icons/${this.Guild.id}/${this.Guild.icon}`;
            urlExists(`${baseOfUrl}.gif`, function (err, exists) {
                res((exists) ? `${baseOfUrl}.gif` : `${baseOfUrl}.webp`);
            });
        });
    }

    async getGuildBanner() {
        return new Promise((res, rej) => {
            let baseOfUrl = `https://cdn.discordapp.com/banners/${this.Guild.id}/${this.Guild.banner}`;
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

    async getUserPfp(User, publicOnly = false) {
        if (typeof User == "undefined" || (typeof User.user.avatar == "undefined" && typeof User.avatar == "undefined")) return `https://tobybot.xyz/assets/imgs/default_discord_avatar.png`;
        return new Promise((res, _rej) => {
            let urlBase = (User.avatar != null && !publicOnly) ? `https://cdn.discordapp.com/guilds/${User.guild.id}/users/${User.user.id}/avatars/${User.avatar}` : `https://cdn.discordapp.com/avatars/${User.user.id}/${User.user.avatar}`;
            urlExists(`${urlBase}.gif`, function (_err, exists) {
                res((exists) ? `${urlBase}.gif` : `${urlBase}.webp`);
            });
        });
    }
}