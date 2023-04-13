/////////////////////////////////
//Guild is the main class for Guilds
/////////////////////////////////

//Importing NodeJS modules
import { I18n } from 'i18n';
import urlExists from 'url-exists';
import { Permissions, Guild as DiscordGuild } from 'discord.js';

//Importing classes
import TobyBot from './TobyBot';
import GuildManager from './GuildManager';
import SQLConfigurationManager from './SQLConfigurationManager';
import SQLPermissionManager from './SQLPermissionManager';
import ModerationManager from './ModerationManager';
import FileLogger from './FileLogger';
import MessageManager from './MessageManager';
import ChannelLogger from './ChannelLogger';
import { SQLError } from './Errors';

const MainLog = new FileLogger();
const LocaleLog = new FileLogger('locale.log');

export default class Guild {
    TobyBot: TobyBot;
    GuildManager: GuildManager;
    Guild: DiscordGuild;
    name: string;
    locale: string;
    MessageManager: any;
    i18n: I18n;
    waitingForMessageData: any;
    waitingForInteractionData: any;
    data: any;
    loggers: any;
    SQLPool: any;
    initialized: boolean;
    isSetup: boolean;
    numId: number;
    ConfigurationManager: SQLConfigurationManager;
    PermissionManager: SQLPermissionManager;
    ModerationManager: ModerationManager;
    lastUpdated: any;
    constructor(GuildManager: GuildManager, guild: DiscordGuild) {
        this.TobyBot = GuildManager.TobyBot;
        this.GuildManager = GuildManager;

        this.Guild = guild;

        this.name = guild.name;
        this.locale = 'en-US';

        this.MessageManager = new MessageManager(this);
        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/guild',
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
            },
            vc: {
                connection: undefined,
                player: undefined,
                ready: undefined,
                playing: undefined,
                NowPlaying: undefined
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
        let apiVersion = {
            numId: this.numId,
            guild: this.Guild,
            locale: this.locale,
            configuration: this.ConfigurationManager.configuration,
            permissions: this.PermissionManager.permissions,
            isSetup: this.isSetup
        };
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
                if (error)throw new SQLError(`Could not fetch the guild from the database.`, {cause: error}).logError();
                if (results.length == 0){
                    this.SQLPool.query(`INSERT INTO \`guilds\` (id, name, locale, configuration, permissions) VALUES (?,?,?,?,?)`, [this.Guild.id, this.Guild.name, this.Guild.preferredLocale, JSON.stringify(require('/app/configurations/defaults/GuildConfiguration.json')), JSON.stringify(require('/app/configurations/defaults/GuildPermissions.json'))], async (error, results) => {
                        if (error)throw new SQLError(`Could not insert the guild in the database.`, {cause: error}).logError();
                        if (results.affectedRows != 1) throw new SQLError(`Could not insert the guild in the database.`).logError();
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
        if (typeof User == "undefined") User = await this.Guild.members.fetch(userString).catch(e => {
            return fallbackUser;
        });
        return User;
    }

    async getChannelFromArg(channelString, fallbackChannel = undefined, channelType = undefined) {
        if (!channelString)return fallbackChannel;
        let Channel = await this.Guild.channels.fetch().then(channels => channels.find(channel => (channel.name.toLowerCase() === channelString.toLowerCase() && (typeof channelType && undefined || channel.type == channelType))));
        if (channelString.startsWith('<#'))channelString = channelString.replace('<#', '').slice(0, -1);
        if (typeof Channel == "undefined") Channel = await this.Guild.channels.fetch(channelString).catch(e => {
            return fallbackChannel;
        });
        return Channel;
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
        return this.Guild.members.fetch(userId).catch(e => undefined);
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