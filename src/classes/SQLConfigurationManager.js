/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');
const mysql = require(`mysql`);
const _ = require(`lodash`);

//Importing classes
const FileLogger = require('./FileLogger');
const ConfigurationManager = require('./ConfigurationManager');

//Creating objects
const MainLog = new FileLogger();

module.exports = class SQLConfigurationManager extends ConfigurationManager {
    constructor(SQLConnectionInfos, SQLTable, SQLWhere = `\`numId\` = 1`, SQLColumn = 'configuration', defaultConfig = {}) {
        super();

        this.SQLPool = undefined;
        this.SQLConnectionInfos = SQLConnectionInfos;
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

    async initialize(createIfNonExistant = false, guildDependent = undefined) {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing ${this.constructor.name} [${moment().diff(startTimer)}ms]`);

        if (typeof this.SQLConnectionInfos != "object") throw new Error('Wrong type given for SQLConnectionInfos.');
        if (typeof this.SQLConnectionInfos.host != "string") throw new Error('Wrong type given for SQLConnectionInfos.host.');
        if (typeof this.SQLConnectionInfos.user != "string") throw new Error('Wrong type given for SQLConnectionInfos.user.');
        if (typeof this.SQLConnectionInfos.password != "string") throw new Error('Wrong type given for SQLConnectionInfos.password.');
        if (typeof this.SQLConnectionInfos.database != "string") throw new Error('Wrong type given for SQLConnectionInfos.database.');
        if (typeof this.SQLConnectionInfos.charset != "string") throw new Error('Wrong type given for SQLConnectionInfos.charset.');
        if (typeof this.SQLConnectionInfos.connectionLimit != "number") throw new Error('Wrong type given for SQLConnectionInfos.connectionLimit.');

        if (typeof guildDependent != "undefined"){
            this.Guild = guildDependent;
            this.SQLPool = guildDependent.SQLPool;
        }else {
            if (this.verbose)MainLog.log(`Creating SQL Pool [${moment().diff(startTimer)}ms]`);
            this.SQLPool = mysql.createPool(this.SQLConnectionInfos)
        }
        
        let loaded = await this.load(true).catch(e => { throw e; });

        if (!loaded) {
            if (!createIfNonExistant) throw new Error('Could not load configuration');
            if (typeof guildDependent != "undefined"){
                await this.Guild.createGuildInSQL().then(async () => {
                    await this.load(true).then(loaded => {
                        if (!loaded) throw new Error('Could not load configuration');
                    }).catch(e => { throw e; });
                }).catch(e => { throw e; });
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
        _.set(this.configuration, path, value);
        return this.save().catch(e => { throw e; });
    }

    async delete(path) {
        _.unset(this.configuration, path);
        return this.save().catch(e => { throw e; });
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