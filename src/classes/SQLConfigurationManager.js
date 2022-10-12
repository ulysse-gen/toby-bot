/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');
const mysql = require(`mysql`);
const _ = require(`lodash`);
const crypto = require(`crypto`);

//Importing classes
const FileLogger = require('./FileLogger');
const ConfigurationManager = require('./ConfigurationManager');
const { ErrorBuilder } = require('./Errors');

//Creating objects
const MainLog = new FileLogger();

module.exports = class SQLConfigurationManager extends ConfigurationManager {
    constructor(SQLTable, SQLWhere = `\`numId\` = 1`, SQLColumn = 'configuration', defaultConfig = {}) {
        super();

        this.SQLPool = undefined;
        this.SQLTable = SQLTable;
        this.SQLWhere = SQLWhere;
        this.SQLcolumn = SQLColumn;

        this._configuration = defaultConfig;
        this.defaultConfiguration = (typeof defaultConfig == "object") ? defaultConfig : JSON.parse(defaultConfig);

        this.initialized = false;
        this.changedSince = false;

        this.lastLoad = moment();
        this.lastSave = moment();
        this.loadCooldown = 10;
        this.saveCooldown = 10;
    }

    async initialize(createIfNonExistant = false, guildDependent = undefined, userDependent = undefined, tobybotDependent = undefined) {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing ${this.constructor.name} [${moment().diff(startTimer)}ms]`);

        if (typeof guildDependent != "undefined"){
            this.Dependency = guildDependent;
            this.SQLPool = guildDependent.SQLPool;
            this.i18n = guildDependent.i18n;
        }
        if (typeof userDependent != "undefined"){
            this.Dependency = userDependent;
            this.SQLPool = userDependent.UserManager.SQLPool;
            this.i18n = userDependent.UserManager.TobyBot.CommunityGuild.i18n;
        }
        if (typeof tobybotDependent != "undefined"){
            this.Dependency = tobybotDependent;
            this.SQLPool = tobybotDependent.SQLPool;
        }
        if (typeof this.SQLPool == "undefined") {
            if (this.verbose)MainLog.log(`Creating SQL Pool [${moment().diff(startTimer)}ms]`);
            this.SQLPool = mysql.createPool({"host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD,"database":process.env.MARIADB_DATABASE,"charset":process.env.MARIADB_CHARSET,"connectionLimit":2})
        }
        
        let loaded = await this.load(true);

        if (!loaded) {
            if (!createIfNonExistant) return false;
            if (typeof this.Dependency != "undefined"){
                await this.Dependency.createInSQL().then(async () => {
                    await this.load(true).then(loaded => {
                        if (!loaded) throw new ErrorBuilder('Could not load configuration').logError();
                    });
                });
            }
        }

        let integrityCheck = await this.mergeRecursive(this.configuration, this.defaultConfiguration);
        if (integrityCheck.updated){
            this.configuration = integrityCheck.result;
            await this.save();
        }

        if (this.verbose)MainLog.log(`Initialized ${this.constructor.name} [${moment().diff(startTimer)}ms]`);
        this.initialized = true;
        return true;
    }

    async set(path, value) {
        this.configurationHistory = this.configuration;
        _.set(this.configuration, path, value);
        return this.save();
    }

    async delete(path) {
        _.unset(this.configuration, path);
        return this.save();
    }

    async saveBackup(backupName) {
        let entryBackup = await new Promise((res, rej) => {
            this.SQLPool.query(`SELECT backups FROM ${this.SQLTable} WHERE ${this.SQLWhere}`, (error, results) => {
                if (error) throw error;
                if (results.length == 0)return res([]);
                res(JSON.parse(results[0].backups));
            });
        });
        entryBackup[this.SQLcolumn][backupName] = {
            timestamp: moment(),
            name: backupName,
            id: crypto.randomBytes(8).toString("hex"),
            content: this.configuration
        }
        return new Promise((res, _rej) => {
            if (this.verbose) MainLog.log(`Saving backup. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
            this.SQLPool.query(`UPDATE \`${this.SQLTable}\` SET \`backups\`=? WHERE ${this.SQLWhere}`, [entryBackup], async function (error, results, _fields) {
                if (error) throw error;
                if (_this.verbose) MainLog.log(`Saved backup. [${_this.SQLTable} => ${_this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                res(true);
            });
        });
    }

    async save(bypass = true) {
        var _this = this;
        let startTimer = moment();
        if ((!this.initialized || this.isSaving) && !bypass) return null;
        if (!bypass && (typeof this.lastSave != "undefined" && moment().diff(this.lastSave, "seconds") <= this.saveCooldown)) return null;
        this.lastSave = moment();
        if (this.verbose) MainLog.log(`Saving configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
        return new Promise((res, _rej) => {
            this.SQLPool.query(`UPDATE \`${this.SQLTable}\` SET \`${this.SQLcolumn}\`=? WHERE ${this.SQLWhere}`, [JSON.stringify(this.configuration)], async function (error, results, _fields) {
                if (error) throw error;
                if (typeof results == "undefined" || results.affectedRows != 1) {
                    if (_this.verbose) MainLog.log(`Could not save configuration. [${_this.SQLTable} => ${_this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                    return res(false);
                }
                if (_this.verbose) MainLog.log(`Saved configuration. [${_this.SQLTable} => ${_this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                _this.isSaving = false;
                _this.changedSince = false;
                res(true);
            });
        });
    }

    async load(bypass = false) {
        let startTimer = moment();
        if ((!this.initialized || this.isSaving) && !bypass) return null;
        if (!bypass && (typeof this.lastLoad != "undefined" && moment().diff(this.lastLoad, "seconds") <= this.loadCooldown)) return null;
        this.lastLoad = moment();
        if (this.verbose) MainLog.log(`Loading configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
        if (this.verbose) MainLog.log(`Fetching configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);

        return new Promise((res, rej) => {
            this.SQLPool.query(`SELECT * FROM ${this.SQLTable} WHERE ${this.SQLWhere}`, (error, results) => {
                if (error) throw error;
                if (results.length == 0)return res(false);

                try {
                    results = JSON.parse(results[0][this.SQLcolumn]);
                } catch (e) {
                    if (this.verbose) MainLog.log(`Could not fetch configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                    return res(this.save());
                }
                if (this.verbose) MainLog.log(`Fetched configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                this.configuration = results;
                res(true);
            });
        });
    }
}