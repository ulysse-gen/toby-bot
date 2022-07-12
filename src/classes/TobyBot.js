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

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

//Creating main variables
let intents = new Intents();
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_VOICE_STATES);

module.exports = class TobyBot {
    constructor(i18n, PackageInformations, TopConfigurationManager) {
        this.client = new Client({ partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "GUILD_SCHEDULED_EVENT"], intents: intents });

        this.i18n = i18n;
        this.PackageInformations = PackageInformations;
        this.TopConfigurationManager = TopConfigurationManager;
        this.ConfigurationManager = undefined;
        this.PermissionManager = undefined;
        this.MetricManager = new MetricManager();
        this.Console = new Console(this);
        this.LifeMetric = this.MetricManager.createMetric("LifeMetric"); //Create the main "LifeMetric" that will follow everything that might happen which is code related (e.g. errors)

        this.loggers = {};

        this.ready = false;
        this.catchErrorsPreventClose = false;
        this.shuttingDown = false;
    }

    async start() {
        this.LifeMetric.addEntry("TopConfigurationManagerInit");
        await this.TopConfigurationManager.initialize(true).catch(e => { throw e} );  //Init Top ConfigurationManager

        this.LifeMetric.addEntry("SQLInit");
        await this.SQLInit();

        MainLog.log(this.i18n.__('bot.start', {version: this.PackageInformations.version.green}));
        this.LifeMetric.addEntry("ManagersInit");
        await this.initManagers().catch(e => { throw e }); //Init the managers
        this.LifeMetric.addEntry("EventAttach");
        await this.attachEvents().catch(e => { throw e }); //Attach events
        this.LifeMetric.addEntry("BotLogin");
        await this.attemptLogin();
        //setInterval(this.reportMemoryUsage, 500); // <-- Enable this to report RAM Usage in console. This is a debug and developpement feature only
    }

    async continueStart() {
        if (!this.TopConfigurationManager.get('API.only'))this.CommandManager.pushSlashCommands();
        if (!this.TopConfigurationManager.get('API.only'))this.ContextMenuCommandManager.pushContextCommands();
        this.LifeMetric.addEntry("botReady");
        this.LifeMetric.addEntry("LoggersInit");
        await this.initLoggers().catch(e => { throw e }); //Attach loggers
        await this.finalTouch().catch(e => { throw e }); //Final touch
        this.ready = true;
    }

    async initManagers() {
        this.LifeMetric.addEntry("CreateSQLPool");
        this.SQLPool = mysql.createPool(this.TopConfigurationManager.get('MySQL'));


        this.LifeMetric.addEntry("ConfigurationManagerCreate");
        this.ConfigurationManager = new SQLConfigurationManager(this.TopConfigurationManager.get('MySQL'), 'tobybot', undefined, undefined, require('../../configurations/defaults/GlobalConfiguration.json')); //Create the Global ConfigurationManager
        this.LifeMetric.addEntry("ConfigurationManagerInit");
        await this.ConfigurationManager.initialize(true, undefined, undefined, this); //Init the Global ConfigurationManager

        
        this.LifeMetric.addEntry("PermissionManagerCreate");
        this.PermissionManager = new SQLPermissionManager(this.TopConfigurationManager.get('MySQL'), 'tobybot', undefined, undefined, require('../../configurations/defaults/GlobalPermissions.json'), true); //Create the Global PermissionManager
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

        
        this.SQLLogger = new SQLLogger(this.TopConfigurationManager.get('MySQL'), 'logs'); //Cheat cuz i need this here
        return true;
    }

    async attachManagers() {
        this.client.TopConfigurationManager = this.TopConfigurationManager; //Attach Top ConfigurationManager to the client objects
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
                    let event = require(`../events/${file}`);

                    if ((typeof event.enabled == "boolean") ? event.enabled : true)
                        if (event.once) {
                            _this.client.once(event.name, (...args)=>event.exec(_this, ...args).catch(e => {
                                ErrorLog.error(`An error occured during the handling of the (once) event ${event.name}:`);
                                console.log(e);
                            }));
                        }else {
                            _this.client.on(event.name, (...args)=>event.exec(_this, ...args).catch(e => {
                                ErrorLog.error(`An error occured during the handling of the event ${event.name}:`);
                                console.log(e);
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

    async reportMemoryUsage() {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        MainLog.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    }

    async SQLInit() {
        let _this = this;
        let con = mysql.createConnection(Object.assign({multipleStatements: true}, _.omit(_.cloneDeep(this.TopConfigurationManager.get('MySQL')), ['database'])));
        return new Promise((res, rej) => {
            con.connect(async (err) => {
                if (err){
                    console.log(err);
                    switch (err.code) {
                        case "ECONNREFUSED":
                            ErrorLog.error(`Could not connect to the database (${err.address}:${err.port}). You may find the solution here:`);
                            ErrorLog.error(`https://${this.TobyBot.ConfigurationManager.get('domainName')}/documentation/help/MySQL_not_connecting_1`);
                            break;

                        case "ETIMEDOUT":
                            ErrorLog.error(`Could not connect to the database (${err.address}:${err.port}). You may find the solution here:`);
                            ErrorLog.error(`https://${this.TobyBot.ConfigurationManager.get('domainName')}/documentation/help/MySQL_not_connecting_2`);
                            break;
    
                        case "ER_ACCESS_DENIED_ERROR":
                            ErrorLog.error(`Could not login to the database. Check your configuration.`);
                            break;
                    
                        default:
                            break;
                    }
                    con.end();
                    process.exit();
                }

                con.query(`GRANT REPLICATION SLAVE, REPLICATION CLIENT, SELECT ON *.* TO '${_this.TopConfigurationManager.get('MySQL.user')}'@'%'`);
    
                return con.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${_this.TopConfigurationManager.get('MySQL.database')}';`, async (err, result, fields) => {
                    if (result.length == 0){
                        return con.query(`CREATE DATABASE \`${_this.TopConfigurationManager.get('MySQL.database')}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, async (err, result) => {
                            if (err) throw err;
                            return con.query(`USE \`${_this.TopConfigurationManager.get('MySQL.database')}\`; ` + fs.readFileSync(`${process.cwd()}/tobybot-structure.sql`).toString(), async (err, result) => {
                                if (err) throw err;
                                MainLog.log(`Created database and imported structure.`);
                                con.end();
                                res(true);
                            });
                        });
                    }else {
                        con.end();
                        res(true);
                    }
                });
            });
        })
    }

    async createInSQL() {
        return new Promise((res, _rej) => {
            this.SQLPool.query(`SELECT * FROM \`tobybot\` WHERE numId=1`, (error, results) => {
                if (error)throw error;
                if (results.length == 0){
                    this.SQLPool.query(`INSERT INTO \`tobybot\` (numId, configuration, permissions) VALUES (?,?,?)`, [1, JSON.stringify(require('../../configurations/defaults/GlobalConfiguration.json')), JSON.stringify(require('../../configurations/defaults/GlobalPermissions.json'))], async (error, results) => {
                        if (error)throw error;
                        if (results.affectedRows != 1) throw new Error('Could not create tobybot.')
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
            let loggedIn = await this.client.login(this.ConfigurationManager.get('token')).then(()=>true).catch(()=>false);
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
            if (this.CommunityGuild.guild.available == false)return false;
            this.TopConfigurationManager.i18n = this.CommunityGuild.i18n; //Attach Top ConfigurationManager to the client objects
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
        if (typeof this.SQLLogger != "undefined")await this.SQLLogger.logShutdown(this, reason, exit);
        process.exit();
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