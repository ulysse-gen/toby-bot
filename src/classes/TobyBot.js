/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
const { Client,Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require(`fs`);

//Importing classes
const FileLogger = require('./FileLogger');
const SQLConfigurationManager = require('./SQLConfigurationManager');
const SQLPermissionManager = require('./SQLPermissionManager');
const MetricManager = require('./MetricManager');
const GuildManager = require('./GuildManager');
const CommandManager = require('./CommandManager');

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

        this.catchErrorsPreventClose = false;
    }

    async start() {
        MainLog.log(this.i18n.__('bot.start', {version: this.PackageInformations.version}));
        this.LifeMetric.addEntry("ManagersInit");
        await this.initManagers().catch(e => { throw e }); //Init the managers
        this.LifeMetric.addEntry("EventAttach");
        await this.attachEvents().catch(e => { throw e }); //Attach events
        this.LifeMetric.addEntry("BotLogin");
        await this.client.login(this.ConfigurationManager.configuration.token).catch(e => { throw e; });
        this.rest = new REST({ version: '9' }).setToken(this.ConfigurationManager.configuration.token);
        await this.CommandManager.pushSlashCommands().catch(e => { throw e; });
        this.LifeMetric.addEntry("botReady").catch(e => { throw e; });
    }

    async initManagers() {
        this.LifeMetric.addEntry("TopConfigurationManagerInit").catch(e => { throw e; });
        await this.TopConfigurationManager.initialize().catch(e => { throw e} );  //Init Top ConfigurationManager

        this.LifeMetric.addEntry("ConfigurationManagerCreate").catch(e => { throw e; });
        this.ConfigurationManager = new SQLConfigurationManager(this.TopConfigurationManager.get('MySQL'), 'tobybot', undefined, undefined, require('../../configurations/defaults/GlobalConfiguration.json')); //Create the Global ConfigurationManager
        this.LifeMetric.addEntry("ConfigurationManagerInit").catch(e => { throw e; });
        await this.ConfigurationManager.initialize().catch(e => {throw e}); //Init the Global ConfigurationManager

        
        this.LifeMetric.addEntry("PermissionManagerCreate").catch(e => { throw e; });
        this.PermissionManager = new SQLPermissionManager(this.TopConfigurationManager.get('MySQL'), 'tobybot', undefined, undefined, require('../../configurations/defaults/GlobalPermissions.json')); //Create the Global PermissionManager
        this.LifeMetric.addEntry("PermissionManagerInit").catch(e => { throw e; });
        await this.PermissionManager.initialize().catch(e => {throw e}); //Init the Global PermissionManager

        this.LifeMetric.addEntry("CommandManagerCreate").catch(e => { throw e; });
        this.CommandManager = new CommandManager(this); //Create the Global CommandManager
        this.LifeMetric.addEntry("CommandManagerInit").catch(e => { throw e; });
        await this.CommandManager.initialize().catch(e => {throw e}); //Init the Global CommandManager

        this.LifeMetric.addEntry("ManagersAttach").catch(e => { throw e; });
        return this.attachManagers().catch(e => { throw e; });  //Attach the managers
    }

    async attachManagers() {
        this.client.TopConfigurationManager = this.TopConfigurationManager; //Attach Top ConfigurationManager to the client objects
        this.client.ConfigurationManager = this.ConfigurationManager; //Attach Global PermissionManager to the client objects
        this.client.PermissionManager = this.PermissionManager; //Attach Global PermissionManager to the client objects
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

    async reload() {
        //Code from https://github.com/sindresorhus/clear-module/blob/main/index.js
        const directory = path.dirname('../../');

        for (const moduleId of Object.keys(require.cache)) {
            delete require.cache[resolveFrom(directory, moduleId)];
        }
    }
}