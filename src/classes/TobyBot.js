/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
const { Client,Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require(`fs`);
const mysql = require(`mysql`);
const _ = require(`lodash`);

//Importing classes
const FileLogger = require('./FileLogger');
const SQLConfigurationManager = require('./SQLConfigurationManager');
const SQLPermissionManager = require('./SQLPermissionManager');
const MetricManager = require('./MetricManager');
const GuildManager = require('./GuildManager');
const CommandManager = require('./CommandManager');
const ChannelLogger = require('./ChannelLogger');
const ModerationManager = require('./ModerationManager');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

//Creating main variables
let intents = new Intents();
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_VOICE_STATES);

module.exports = class TobyBot {
    constructor(i18n, PackageInformations, TopConfigurationManager) {
        this.client = new Client({ partials: ["CHANNEL"], intents: intents });

        this.i18n = i18n;
        this.PackageInformations = PackageInformations;
        this.TopConfigurationManager = TopConfigurationManager;
        this.ConfigurationManager = undefined;
        this.PermissionManager = undefined;
        this.GuildManager = new GuildManager(this);
        this.MetricManager = new MetricManager();
        this.LifeMetric = this.MetricManager.createMetric("LifeMetric"); //Create the main "LifeMetric" that will follow everything that might happen which is code related (e.g. errors)

        this.loggers = {};

        this.catchErrorsPreventClose = false;
    }

    async start() {

        this.LifeMetric.addEntry("TopConfigurationManagerInit");
        await this.TopConfigurationManager.initialize().catch(e => { throw e} );  //Init Top ConfigurationManager
        this.LifeMetric.addEntry("SQLInit");
        await this.SQLInit();

        MainLog.log(this.i18n.__('bot.start', {version: this.PackageInformations.version}));
        this.LifeMetric.addEntry("ManagersInit");
        await this.initManagers().catch(e => { throw e }); //Init the managers
        this.LifeMetric.addEntry("EventAttach");
        await this.attachEvents().catch(e => { throw e }); //Attach events
        this.LifeMetric.addEntry("BotLogin");
        await this.client.login(this.ConfigurationManager.configuration.token);
        this.rest = new REST({ version: '9' }).setToken(this.ConfigurationManager.configuration.token);
        await this.CommandManager.pushSlashCommands();
        this.LifeMetric.addEntry("botReady");
        this.LifeMetric.addEntry("LoggersInit");
        await this.initLoggers().catch(e => { throw e }); //Attach loggers
        await this.finalTouch().catch(e => { throw e }); //Final touch

        //setInterval(this.reportMemoryUsage, 500); // <-- Enable this to report RAM Usage in console. This is a debug and developpement feature only
    }

    async initManagers() {
        this.LifeMetric.addEntry("ConfigurationManagerCreate");
        this.ConfigurationManager = new SQLConfigurationManager(this.TopConfigurationManager.get('MySQL'), 'tobybot', undefined, undefined, require('../../configurations/defaults/GlobalConfiguration.json')); //Create the Global ConfigurationManager
        this.LifeMetric.addEntry("ConfigurationManagerInit");
        await this.ConfigurationManager.initialize(); //Init the Global ConfigurationManager

        
        this.LifeMetric.addEntry("PermissionManagerCreate");
        this.PermissionManager = new SQLPermissionManager(this.TopConfigurationManager.get('MySQL'), 'tobybot', undefined, undefined, require('../../configurations/defaults/GlobalPermissions.json'), true); //Create the Global PermissionManager
        this.LifeMetric.addEntry("PermissionManagerInit");
        await this.PermissionManager.initialize(); //Init the Global PermissionManager

        this.LifeMetric.addEntry("CommandManagerCreate");
        this.CommandManager = new CommandManager(this); //Create the Global CommandManager
        this.LifeMetric.addEntry("CommandManagerInit");
        await this.CommandManager.initialize(); //Init the Global CommandManager

        this.LifeMetric.addEntry("ManagersAttach");
        return this.attachManagers();  //Attach the managers
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
        this.CommunityGuild = await this.GuildManager.getGuildById(this.ConfigurationManager.get('communityGuild'));
        for (const logger in this.ConfigurationManager.get('logging')) {
            this.loggers[logger] = new ChannelLogger(this.CommunityGuild, this.ConfigurationManager.get(`logging.${logger}`))
            await this.loggers[logger].initialize();
        }
        return true;
    }

    async finalTouch() {
        this.ModerationManager = new ModerationManager(this.CommunityGuild); //Create the Global CommandManager

        setInterval(() => this.ModerationManager.clearExpired(), 10000); //Clear expired punishments every 10 seconds
        this.ModerationManager.clearExpired()
        return true;
    }

    async reload() {
        //Code from https://github.com/sindresorhus/clear-module/blob/main/index.js
        const directory = path.dirname('../../');

        for (const moduleId of Object.keys(require.cache)) {
            delete require.cache[resolveFrom(directory, moduleId)];
        }
    }

    async reportMemoryUsage() {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        MainLog.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    }

    async SQLInit() {
        let con = mysql.createConnection(_.omit(_.cloneDeep(this.TopConfigurationManager.get('MySQL')), ['database']));
        con.connect((err) => {
            if (err && err.code == "ECONNREFUSED")ErrorLog.error(`Could not connect to the database (${err.address}:${err.port}). Check that your SQL is running and your configuration.`);

            con.query(`USE \`${this.TopConfigurationManager.get('MySQL.database')}\``, (err, result, fields) => {
                if (err && err.code == "ER_BAD_DB_ERROR") {
                    ErrorLog.error(`Missing database (${this.TopConfigurationManager.get('MySQL.database')}), creating it.`);
                    con.query(`CREATE DATABASE \`${this.TopConfigurationManager.get('MySQL.database')}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, function (err, result) {
                        if (err) throw err;
                        ErrorLog.error(`Database created, you may now import the structure with the basics infos before restarting.`);
                        process.exit();
                    });
                }
            });
        });

    }
}