/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');
const mysql = require(`mysql`);

//Importing classes
const FileLogger = require('./FileLogger');
const SQLConfigurationManager = require('./SQLConfigurationManager');

//Creating objects
const MainLog = new FileLogger();

module.exports = class SQLPermissionManager extends SQLConfigurationManager {
    constructor(SQLConnectionInfos, SQLTable, SQLWhere = `\`numId\` = 1`, SQLColumn = 'permissions', defaultConfig = {}) {
        super();

        this.SQLPool = undefined;
        this.SQLConnectionInfos = SQLConnectionInfos;
        this.SQLTable = SQLTable;
        this.SQLWhere = SQLWhere;
        this.SQLcolumn = SQLColumn;

        this.configuration = defaultConfig;
        this.defaultConfiguration = (typeof defaultConfig == "object") ? defaultConfig : JSON.parse(defaultConfig);
        this.permission = this.configuration;

        this.initialized = false;
    }

    async initialize(createIfNonExistant = false, guildDependent = undefined) {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing PermissionManager [${moment().diff(startTimer)}ms]`);

        if (typeof this.SQLConnectionInfos != "object")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos. Expected object received ${typeof this.SQLConnectionInfos}`;
        if (typeof this.SQLConnectionInfos.host != "string")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos.host. Expected string received ${typeof this.SQLConnectionInfos.host}`;
        if (typeof this.SQLConnectionInfos.user != "string")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos.user. Expected string received ${typeof this.SQLConnectionInfos.user}`;
        if (typeof this.SQLConnectionInfos.password != "string")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos.password. Expected string received ${typeof this.SQLConnectionInfos.password}`;
        if (typeof this.SQLConnectionInfos.database != "string")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos.database. Expected string received ${typeof this.SQLConnectionInfos.database}`;
        if (typeof this.SQLConnectionInfos.charset != "string")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos.charset. Expected string received ${typeof this.SQLConnectionInfos.charset}`;
        if (typeof this.SQLConnectionInfos.connectionLimit != "number")throw `${__filename} => initialize(): Wrong type given for SQLConnectionInfos.connectionLimit. Expected number received ${typeof this.SQLConnectionInfos.charset}`;

        if (typeof guildDependent != "undefined"){
            this.Guild = guildDependent;
            this.SQLPool = guildDependent.SQLPool;
        }else {
            if (this.verbose)MainLog.log(`Creating SQL Pool [${moment().diff(startTimer)}ms]`);
            this.SQLPool = mysql.createPool(this.SQLConnectionInfos)
        }

        let loaded = await this.load(true).catch(e => { throw e; });
        
        if (!loaded) {
            if (!createIfNonExistant) throw `${__filename} => initialize(): Could not load permissions`;
            if (typeof guildDependent != "undefined"){
                await this.Guild.createGuildInSQL().then(async () => {
                    await this.load(true).then(loaded => {
                        if (!loaded) throw `${__filename} => initialize(): Could not load permissions`;
                    }).catch(e => { throw e; });
                }).catch(e => { throw e; });
            }
        }

        let integrityCheck = await this.mergeRecursive(this.configuration, this.defaultConfiguration);
        if (integrityCheck.updated){
            this.configuration = integrityCheck.result;
            await this.save();
        }

        if (this.verbose)MainLog.log(`Initialized PermissionManager [${moment().diff(startTimer)}ms]`);
        this.initialized = true;
        return true;
    }
}