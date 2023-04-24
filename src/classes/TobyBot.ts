/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
import { ChannelManager, Client, Intents, ClientApplication, ClientPresence, ClientVoiceManager, GuildManager as DiscordGuildManager, If, Sweepers, User, UserManager as DiscordUserManager, WebSocketManager } from "discord.js";
import { REST } from '@discordjs/rest';
import * as fs from "fs";
import mysql from "mysql";
import _ from "lodash";
import { I18n } from 'i18n';

//Importing classes
import MetricManager from './MetricManager';
import GuildManager from './GuildManager';
import ChannelLogger from './ChannelLogger';
import AutoModeration from './AutoModeration';
import { EventHandlingError, FileError, SQLError, UnknownError } from './Errors';
import Metric from './Metric';
import Guild from "./Guild";
import { CustomClient, PackageInformations } from "../interfaces/main";
import UserManager from "./UserManager";
import SQLConfigurationManager from "./SQLConfigurationManager";
import SQLPermissionManager from "./SQLPermissionManager";
import API from "./API";
import Console from "./Console";
import FileLogger from "./FileLogger";
import SQLLogger from "./SQLLogger";
import ModerationManager from "./ModerationManager";
import CommandManager from "./CommandManager";
import ContextMenuCommandManager from "./ContextMenuCommandManager";
import MYSQLWatcher from "./MYSQLWatcher";
import PresenceManager from "./PresenceManager";

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

//Creating main variables
let intents = new Intents();
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_VOICE_STATES);

export default class TobyBot {
    client: CustomClient;
    ws: WebSocketManager;
    voice: ClientVoiceManager;
    users: DiscordUserManager;
    guilds: DiscordGuildManager;
    channels: ChannelManager;
    sweepers: Sweepers;
    user: User;
    i18n: I18n;
    PackageInformations: PackageInformations;
    ConfigurationManager: SQLConfigurationManager;
    PermissionManager: SQLPermissionManager;
    MetricManager: MetricManager;
    PresenceManager: PresenceManager;
    Console: Console;
    LifeMetric: Metric;
    AutoModeration: AutoModeration;
    loggers: {commandExecution?:ChannelLogger, DM?:ChannelLogger, updates?:ChannelLogger, moderationLogs?:ChannelLogger};
    ready: boolean;
    catchErrorsPreventClose: boolean;
    shuttingDown: boolean;
    registerCommands: boolean;
    CommandManager: CommandManager;
    ContextMenuCommandManager: ContextMenuCommandManager;
    SQLPool: any;
    UserManager: UserManager;
    GuildManager: GuildManager;
    SQLLogger: SQLLogger;
    CommunityGuild: Guild;
    ModerationManager: ModerationManager;
    API: API;
    SQLWatcher: MYSQLWatcher;
    rest: any;
    locale: string;
    commandsToRegister: any;
    constructor(i18n: I18n, PackageInformations: PackageInformations) {
        this.client = new Client({ 
            sweepers: {
                messages: {
                    interval: 120,
                    lifetime: 300
                },
                threads: {
                    interval: 300,
                    lifetime: 310
                }
            },
            partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "GUILD_SCHEDULED_EVENT"], 
            intents: intents 
        }) as CustomClient;

        this.ws = this.client.ws;
        this.voice = this.client.voice;
        this.users = this.client.users;
        this.guilds = this.client.guilds;
        this.channels = this.client.channels;
        this.sweepers = this.client.sweepers;
        this.user = this.client.user;


        this.i18n = i18n;
        this.PackageInformations = PackageInformations;
        this.ConfigurationManager = undefined;
        this.PermissionManager = undefined;
        this.MetricManager = new MetricManager(this);
        this.PresenceManager = new PresenceManager(this);
        this.Console = new Console(this);
        this.LifeMetric = this.MetricManager.createMetric("LifeMetric"); //Create the main "LifeMetric" that will follow everything that might happen which is code related (e.g. errors)
        //this.AutoModeration = new AutoModeration(this);

        this.loggers = {};

        this.ready = false;
        this.catchErrorsPreventClose = process.env['NODE_ENV'] == "production";
        this.shuttingDown = false;

        this.registerCommands = true;
    }

    async start() {
        await this.VerifyContext();

        this.LifeMetric.addEntry("SQLInit");
        await this.SQLInit();

        MainLog.log(this.i18n.__('bot.starting', {version: this.PackageInformations.version.green}));
        this.LifeMetric.addEntry("ManagersInit");
        await this.initManagers(); //Init the managers
        this.LifeMetric.addEntry("EventAttach");
        await this.attachEvents(); //Attach events
        this.LifeMetric.addEntry("BotLogin");
        await this.attemptLogin();
    }

    async continueStart() {
        if (!process.env.TOBYBOT_API_ONLY && this.registerCommands){
            await this.CommandManager.pushSlashCommands();
            await this.ContextMenuCommandManager.pushContextCommands();
            await this.CommandManager.pushAllCommands();
        }
        this.LifeMetric.addEntry("botReady");
        this.LifeMetric.addEntry("LoggersInit");
        this.LifeMetric.addEntry("SweeperInit");
        await this.initLoggers(); //Attach loggers
        await this.finalTouch(); //Final touch
        await this.checkForUpdate();
        this.ready = true;
    }

    async VerifyContext() {
        if (!fs.existsSync('/data'))try {
            fs.mkdirSync('/data');
        } catch (e) {
            throw new FileError(`Missing '/data' folder and its creation failed.`, {cause: e});
        }
        if (!fs.existsSync('/data/logs'))try {
            fs.mkdirSync('/data/logs');
        } catch (e) {
            throw new FileError(`Missing '/data/logs' folder and its creation failed.`, {cause: e});
        }
        if (!fs.existsSync('/data/configs'))try {
            fs.mkdirSync('/data/configs');
        } catch (e) {
            throw new FileError(`Missing '/data/configs' folder and its creation failed.`, {cause: e});
        }
        return this;
    }

    async initManagers() {
        this.LifeMetric.addEntry("CreateSQLPool");
        this.SQLPool = mysql.createPool({"host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD,"database":process.env.MARIADB_DATABASE_NC,"charset":process.env.MARIADB_CHARSET,"connectionLimit":parseInt(process.env.MARIADB_CONNECTION_LIMIT)});


        this.LifeMetric.addEntry("ConfigurationManagerCreate");
        this.ConfigurationManager = new SQLConfigurationManager('tobybot', undefined, undefined, require('/app/configurations/defaults/GlobalConfiguration.json')); //Create the Global ConfigurationManager
        this.LifeMetric.addEntry("ConfigurationManagerInit");
        await this.ConfigurationManager.initialize(true, this); //Init the Global ConfigurationManager

        
        this.LifeMetric.addEntry("PermissionManagerCreate");
        this.PermissionManager = new SQLPermissionManager('tobybot', undefined, undefined, require('/app/configurations/defaults/GlobalPermissions.json'), true); //Create the Global PermissionManager
        this.LifeMetric.addEntry("PermissionManagerInit");
        await this.PermissionManager.initialize(true, this); //Init the Global PermissionManager

        this.LifeMetric.addEntry("CommandManagerCreate");
        this.CommandManager = new CommandManager(this); //Create the Global CommandManager
        this.LifeMetric.addEntry("CommandManagerInit");
        await this.CommandManager.initialize(); //Init the Global CommandManager

        this.LifeMetric.addEntry("CommandManagerCreate");
        this.ContextMenuCommandManager = new ContextMenuCommandManager(this); //Create the Global ContextMenuCommandManager
        this.LifeMetric.addEntry("CommandManagerInit");
        await this.ContextMenuCommandManager.initialize(); //Init the Global ContextMenuCommandManager
 
        this.UserManager = new UserManager(this);
        this.GuildManager = new GuildManager(this);

        this.LifeMetric.addEntry("ManagersAttach");
        await this.attachManagers();  //Attach the managers

        
        this.SQLLogger = new SQLLogger(this, 'logs'); //Cheat cuz i need this here
        return true;
    }

    async attachManagers() {
        this.client.ConfigurationManager = this.ConfigurationManager; //Attach Global PermissionManager to the client objects
        this.client.PermissionManager = this.PermissionManager; //Attach Global PermissionManager to the client objects
        this.client.CommandManager = this.CommandManager; //Attach Global PermissionManager to the client objects
        this.client.MetricManager = this.MetricManager; //Attach Global MetricManager to the client objects
        this.client.PresenceManager = this.PresenceManager; //Attach Global PresenceManager to the client objects
        return true;
    }

    async attachEvents() {
        var _this = this;
        await new Promise<void>((res, _rej) => {
            fs.readdir(`./src/events/`, function (err, files) { //Read events folder
                if (err) throw err;
                files.filter(file => file.endsWith('.ts')).forEach((file, index, array) => { //For each files in the folder
                    let event = require(`/app/src/events/${file}`);

                    
                    if (event.default){
                        event = event.default;
                        if ((typeof event.enabled == "boolean") ? event.enabled : true)if (event.once) {
                            _this.client.once(event.name, (...args)=>event.exec(_this, ...args).catch(e => {
                                throw new EventHandlingError(`An error occured trying to handle an event`, {cause: e, event: event.name}).logError();
                            }));
                        }else {
                            _this.client.on(event.name, (...args)=>event.exec(_this, ...args).catch(e => {
                                throw new EventHandlingError(`An error occured trying to handle an event`, {cause: e, event: event.name}).logError();
                            }));
                        }
                    }   
                    
                    if (index === array.length -1) res();
                });
            });
        });
        MainLog.log(this.i18n.__('bot.events.attach'));
        return true;
    }

    async initLoggers(){
        await this.checkCommunityGuild();
        for (const logger in this.ConfigurationManager.get('logging')) {
            this.loggers[logger] = new ChannelLogger(this.CommunityGuild, this.ConfigurationManager.get(`logging.${logger}`))
            await this.loggers[logger].initialize();
        }
        return true;
    }

    async finalTouch() {
        this.ModerationManager = new ModerationManager(this.CommunityGuild); //Create the Global CommandManager
        this.PresenceManager.Initialize();

        setInterval(() => this.ModerationManager.clearExpired(), 10000); //Clear expired punishments every 10 seconds
        this.ModerationManager.clearExpired();

        this.LifeMetric.addEntry("APIStarting");
        this.API = new API(this);
        await this.API.initialize();
        await this.UserManager.initialize();
        this.SQLWatcher = new MYSQLWatcher(this);

        return true;
    }

    async SQLInit() {
        let SQLConnection = mysql.createConnection({multipleStatements: true, "host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD,"charset":process.env.MARIADB_CHARSET});
        await new Promise((res, _rej) => {
            SQLConnection.connect((err) => {
                if (err) {
                    console.log(err);
                    switch (err.code) {
                        case "ECONNREFUSED":
                            ErrorLog.error(`Could not connect to the database.`);
                            break;
    
                        case "ETIMEDOUT":
                            ErrorLog.error(`Could not connect to the database.`);
                            break;
    
                        default:
                            break;
                    }
                    SQLConnection.end();
                    process.exit();
                }
                res(true);
            })
        });
        let SchemaExists = await new Promise((res, rej) => {
            SQLConnection.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${process.env.MARIADB_DATABASE_NC}';`, (err, result) => {
                if (err) throw err;
                res(result.length != 0);
            })
        });
        if (!SchemaExists) await new Promise((res, rej) => {
            SQLConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MARIADB_DATABASE_NC}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${process.env.MARIADB_DATABASE_NC}\`; ` + fs.readFileSync(`${process.cwd()}/configurations/SQL_Structure/tobybot-${this.PackageInformations.version}-structure.sql`).toString(), async (err, result) => {
                if (err) throw err;
                MainLog.log(`Created database and imported structure.`);
                res(true);
            })
        });

        await new Promise((res) => res(SQLConnection.query(`GRANT REPLICATION SLAVE, REPLICATION CLIENT, SELECT ON *.* TO 'root'@'%'`)));
        SQLConnection.end();
        return true;
    }

    async createInSQL() {
        return new Promise((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`tobybot\` WHERE numId=1`, (error, results) => {
                if (error)throw error;
                if (results.length == 0){
                    this.SQLPool.query(`INSERT INTO \`tobybot\` (numId, configuration, permissions) VALUES (?,?,?)`, [1, JSON.stringify(require('/app/configurations/defaults/GlobalConfiguration.json')), JSON.stringify(require('/app/configurations/defaults/GlobalPermissions.json'))], async (error, results) => {
                        if (error) throw new SQLError('Could not insert TobyBot in the databse.', {cause: error}).logError();
                        if (results.affectedRows != 1) throw new UnknownError('Could not insert TobyBot in the databse.').logError();
                        res(true);
                    });
                }else {
                    res(true);
                }
            });
        });
    }
    
    async attemptLogin(attempt = 0) {
        let tryLogin = async () => {
            let loggedIn = await this.client.login(this.ConfigurationManager.get('token')).then(()=>true).catch((e)=>{
                MainLog.log(this.i18n.__('bot.inputToken.couldNotLogin'));
                return false;
            });
            if (loggedIn)this.rest = new REST({ version: '9' }).setToken(this.ConfigurationManager.get('token'));
            return loggedIn;
        }

        if (!await tryLogin()){
            await this.ConfigurationManager.set('token', await this.Console.askForToken());
            MainLog.log(this.i18n.__('bot.inputToken.defined'));
            return this.attemptLogin(attempt+1);
        }else return true;
    }

    async checkCommunityGuild(attempt = 0) {
        let tryFetch = async () => {
            if (this.ConfigurationManager.get('communityGuild').replaceAll(' ', '') == "")return false;
            this.CommunityGuild = await this.GuildManager.getGuildById(this.ConfigurationManager.get('communityGuild'));
            if (typeof this.CommunityGuild == "undefined")return false;
            if (this.CommunityGuild.Guild.available == false)return false;
            this.ConfigurationManager.i18n = this.CommunityGuild.i18n; //Attach Global PermissionManager to the client objects
            this.PermissionManager.i18n = this.CommunityGuild.i18n; //Attach Global PermissionManager to the client objects
            return (typeof this.CommunityGuild == "undefined") ? false : true;
        }


        if (!await tryFetch()){
            MainLog.log(this.i18n.__('bot.inputCommunityGuild.couldNotFetch'));
            await this.ConfigurationManager.set('communityGuild', await this.Console.askForCommunityGuild());
            MainLog.log(this.i18n.__('bot.inputCommunityGuild.defined'));
            return this.checkCommunityGuild(attempt+1);
        }else return true;
    }

    async shutdown(reason: string = "undefined", exit: string = "undefined") {
        if (this.shuttingDown)return true;
        this.shuttingDown = true;
        await this.LifeMetric.end();
        try {
            if (typeof this.SQLLogger != "undefined")await this.SQLLogger.logShutdown(this, reason, exit);
            for (const guild in this.GuildManager.guilds) {
                if (this.GuildManager.guilds[guild].MusicSubscription){
                    this.GuildManager.guilds[guild].MusicSubscription.voiceConnection.destroy();
                    delete this.GuildManager.guilds[guild].MusicSubscription;
                }
            }
            this.SQLPool.end();
            await this.SQLWatcher.EventWatcher.stop();
            await this.client.user.setPresence({status: "invisible"});
            await this.client.destroy();
        } catch(e) {

        }

        MainLog.log(this.i18n.__('bot.shuttingDown'));
        process.exit(0);
    }

    async checkForUpdate() {
        if (this.PackageInformations.version == this.ConfigurationManager.get("system.bot-version"))return;
        const regex = /[^-0-9.,]+/;
        const CurrentVersionSplit = this.PackageInformations.version.split('.').map(i => i.replace(regex, ''));
        const PreviousVersionSplit = this.ConfigurationManager.get("system.bot-version").split('.').map(i => i.replace(regex, ''));
        this.ConfigurationManager.set("system.bot-version", this.PackageInformations.version.replace('silent', ''));
        if (!this.PackageInformations.changelog || this.PackageInformations.changelog.replace(' ', '') == "" || this.PackageInformations.changelog.replace(' ', '') == "silent")return;
        if (process.env.NODE_ENV == "development")return;
        if (CurrentVersionSplit[0] < PreviousVersionSplit[0])return; //Downgrade major version
        if (CurrentVersionSplit[0] > PreviousVersionSplit[0]){ //New major update
            if (!this.ConfigurationManager.get('logging.updates.inChannel'))return;
            this.loggers.updates.logMainEmbed(this.i18n.__('channelLogging.updates.major.title', {newVersion: this.ConfigurationManager.get("system.bot-version")}), this.i18n.__('channelLogging.updates.major.description', {changelog: this.PackageInformations.changelog}));
            return;
        }
        if (CurrentVersionSplit[1] < PreviousVersionSplit[1])return; //Downgrade feature update
        if (CurrentVersionSplit[1] > PreviousVersionSplit[1]){ //New feature update
            if (!this.ConfigurationManager.get('logging.updates.inChannel'))return;
            this.loggers.updates.logMainEmbed(this.i18n.__('channelLogging.updates.feature.title', {newVersion: this.ConfigurationManager.get("system.bot-version")}), this.i18n.__('channelLogging.updates.feature.description', {changelog: this.PackageInformations.changelog}));
            return;
        }
        if (CurrentVersionSplit[2] < PreviousVersionSplit[2])return; //Downgrade bugfix update
        if (CurrentVersionSplit[2] > PreviousVersionSplit[2]){ //New bugfix update
            if (!this.ConfigurationManager.get('logging.updates.inChannel'))return;
            this.loggers.updates.logMainEmbed(this.i18n.__('channelLogging.updates.bugfix.title', {newVersion: this.ConfigurationManager.get("system.bot-version")}), this.i18n.__('channelLogging.updates.bugfix.description', {changelog: this.PackageInformations.changelog}));
            return;
        }
        return; //Version unchanged
    }

    async loadSQLContent(checkForUpdate = false) {
        return new Promise((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`tobybot\` WHERE numId=1`, (error, results) => {
                if (error)throw error;
                if (results.length != 0){
                    this.locale = results[0].locale;
                    if (checkForUpdate && JSON.stringify(this.ConfigurationManager.configuration) != results[0].configuration)this.ConfigurationManager.load();
                    if (checkForUpdate && JSON.stringify(this.PermissionManager.permissions) != results[0].permissions)this.PermissionManager.load();
                    this.i18n.setLocale(this.locale);
                    res(true)
                }
                res(true);
            });
        });
    }
}