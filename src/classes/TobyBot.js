/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
const { Client,Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require(`fs`);
const mysql = require(`mysql`);
const colors = require(`colors`);
const _ = require(`lodash`);

//Importing classes
const FileLogger = require('./FileLogger');
const SQLLogger = require('./SQLLogger');
const SQLConfigurationManager = require('./SQLConfigurationManager');
const SQLPermissionManager = require('./SQLPermissionManager');
const MetricManager = require('./MetricManager');
const GuildManager = require('./GuildManager');
const UserManager = require('./UserManager');
const CommandManager = require('./CommandManager');
const ContextMenuCommandManager = require('./ContextMenuCommandManager');
const ChannelLogger = require('./ChannelLogger');
const ModerationManager = require('./ModerationManager');
const API = require('./API');
const Console = require('./Console');
const MYSQLWatcher = require('./MYSQLWatcher');
const AutoModeration = require('./AutoModeration');
const { ErrorBuilder, ErrorType } = require('./Errors');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

//Creating main variables
let intents = new Intents();
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_VOICE_STATES);

module.exports = class TobyBot {
    constructor(i18n, PackageInformations) {
        this.client = new Client({ 
            sweepers: {
                messages: {
                    maximumSize: 250,
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
        });

        this.ws = this.client.ws;
        this.actions = this.client.actions;
        this.voice = this.client.voice;
        this.users = this.client.users;
        this.guilds = this.client.guilds;
        this.channels = this.client.channels;
        this.sweepers = this.client.sweepers;
        this.presence = this.client.presence;
        this.user = this.client.user;
        this.application = this.client.application;
        this.readyTimestamp = this.client.readyTimestamp;
        this.application = this.client.application;


        this.i18n = i18n;
        this.PackageInformations = PackageInformations;
        this.ConfigurationManager = undefined;
        this.PermissionManager = undefined;
        this.MetricManager = new MetricManager();
        this.Console = new Console(this);
        this.LifeMetric = this.MetricManager.createMetric("LifeMetric"); //Create the main "LifeMetric" that will follow everything that might happen which is code related (e.g. errors)
        this.AutoModeration = new AutoModeration(this);

        this.loggers = {};

        this.ready = false;
        this.catchErrorsPreventClose = false;
        this.shuttingDown = false;

        this.registerCommands = true;
    }

    async start() {
        await this.VerifyContext();

        this.LifeMetric.addEntry("SQLInit");
        await this.SQLInit();

        MainLog.log(this.i18n.__('bot.start', {version: this.PackageInformations.version.green}));
        this.LifeMetric.addEntry("ManagersInit");
        await this.initManagers().catch(e => { throw e }); //Init the managers
        this.LifeMetric.addEntry("EventAttach");
        await this.attachEvents().catch(e => { throw e }); //Attach events
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
        await this.initLoggers().catch(e => { throw e }); //Attach loggers
        await this.finalTouch().catch(e => { throw e }); //Final touch
        this.ready = true;
    }

    async VerifyContext() {
        if (!fs.existsSync('/data'))try {
            fs.mkdirSync('/data');
        } catch (e) {
            throw new ErrorBuilder(`Missing '/data' folder and its creation failed`, {cause: e}).setType('FILE_ERROR').logError();
        }
        if (!fs.existsSync('/data/logs'))try {
            fs.mkdirSync('/data/logs');
        } catch (e) {
            throw new ErrorBuilder(`Missing '/data/logs' folder and its creation failed`, {cause: e}).setType('FILE_ERROR').logError();
        }
        if (!fs.existsSync('/data/configs'))try {
            fs.mkdirSync('/data/configs');
        } catch (e) {
            throw new ErrorBuilder(`Missing '/data/configs' folder and its creation failed`, {cause: e}).setType('FILE_ERROR').logError();
        }
        return this;
    }

    async initManagers() {
        this.LifeMetric.addEntry("CreateSQLPool");
        this.SQLPool = mysql.createPool({"host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD,"database":process.env.MARIADB_DATABASE_NC,"charset":process.env.MARIADB_CHARSET,"connectionLimit":process.env.MARIADB_CONNECTION_LIMIT});


        this.LifeMetric.addEntry("ConfigurationManagerCreate");
        this.ConfigurationManager = new SQLConfigurationManager('tobybot', undefined, undefined, require('/app/configurations/defaults/GlobalConfiguration.json')); //Create the Global ConfigurationManager
        this.LifeMetric.addEntry("ConfigurationManagerInit");
        await this.ConfigurationManager.initialize(true, undefined, undefined, this); //Init the Global ConfigurationManager

        
        this.LifeMetric.addEntry("PermissionManagerCreate");
        this.PermissionManager = new SQLPermissionManager('tobybot', undefined, undefined, require('/app/configurations/defaults/GlobalPermissions.json'), true); //Create the Global PermissionManager
        this.LifeMetric.addEntry("PermissionManagerInit");
        await this.PermissionManager.initialize(true, undefined, undefined, this); //Init the Global PermissionManager

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
        return true;
    }

    async attachEvents() {
        var _this = this;
        await new Promise((res, _rej) => {
            fs.readdir(`./src/events/`, function (err, files) { //Read events folder
                if (err) throw err;
                files.filter(file => file.endsWith('.js')).forEach((file, index, array) => { //For each files in the folder
                    let event = require(`/app/src/events/${file}`);

                    

                    if ((typeof event.enabled == "boolean") ? event.enabled : true)if (event.once) {
                        _this.client.once(event.name, (...args)=>event.exec(_this, ...args).catch(e => {
                            let err = new ErrorBuilder(`An error occured trying to handle the event ${event.name}.`, {cause: e}).setType(ErrorType.EventHandling);
                            console.log(err);
                            return undefined;
                        }));
                    }else {
                        _this.client.on(event.name, (...args)=>event.exec(_this, ...args).catch(e => {
                            let err = new ErrorBuilder(`An error occured trying to handle the event ${event.name}.`, {cause: e}).setType(ErrorType.EventHandling);
                            console.log(err);
                            return undefined;
                        }));
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
        let SQLConnection = mysql.createConnection({multipleStatements: true, "host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD,"charset":process.env.MARIADB_CHARSET,"connectionLimit":process.env.MARIADB_CONNECTION_LIMIT});
        await new Promise((res, _rej) => {
            SQLConnection.connect((err) => {
                if (err) {
                    console.log(err);
                    switch (err.code) {
                        case "ECONNREFUSED":
                            ErrorLog.error(`Could not connect to the database (${err.address}:${err.port}).`);
                            break;
    
                        case "ETIMEDOUT":
                            ErrorLog.error(`Could not connect to the database (${err.address}:${err.port}).`);
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
            SQLConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MARIADB_DATABASE_NC}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${process.env.MARIADB_DATABASE_NC}\`; ` + fs.readFileSync(`${process.cwd()}/SQL_Structure/tobybot-${this.PackageInformations.version}-structure.sql`).toString(), async (err, result) => {
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
                        if (error)throw error;
                        if (results.affectedRows != 1) throw new ErrorBuilder('Could not insert TobyBot in the databse.').logError();
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
                console.log(e);
            });
            if (loggedIn)this.rest = new REST({ version: '9' }).setToken(this.ConfigurationManager.get('token'));
            return loggedIn;
        }

        if (!await tryLogin()){
            MainLog.log(this.i18n.__('bot.inputToken.couldNotLogin'));
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

    async shutdown(reason = "undefined", exit = "undefined") {
        if (this.shuttingDown)return true;
        this.shuttingDown = true;
        await this.LifeMetric.end();
        try {
            if (typeof this.SQLLogger != "undefined")await this.SQLLogger.logShutdown(this, reason, exit);
    
            this.SQLPool.end();
            await this.SQLWatcher.EventWatcher.stop();
            await this.client.user.setPresence({status: "invisible"});
            await this.client.destroy();
        } catch(e) {

        }

        MainLog.log(this.i18n.__('bot.shuttingDown'));
        process.exit(0);
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