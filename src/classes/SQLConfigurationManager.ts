/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
import moment from 'moment';
import mysql from "mysql";
import _ from "lodash";
import crypto from "crypto";

//Importing classes
import FileLogger from './FileLogger';
import ConfigurationManager from './ConfigurationManager';
import { UnknownError } from './Errors';
import TobyBot from './TobyBot';
import Guild from './Guild';
import TobyBotUser from './TobyBotUser';

//Creating objects
const MainLog = new FileLogger();

export default class SQLConfigurationManager extends ConfigurationManager {
    constructor(SQLTable, SQLWhere = `\`numId\` = 1`, SQLColumn = 'configuration', defaultConfig: {} | string = {}) {
        super();

        this._configuration = {};


        this.verbose = false;

        this.SQLPool = undefined;
        this.SQLTable = SQLTable;
        this.SQLWhere = SQLWhere;
        this.SQLcolumn = SQLColumn;

        this._configuration = defaultConfig;
        this.defaultConfiguration = (typeof defaultConfig == "object") ? defaultConfig : JSON.parse(defaultConfig as string);

        this.initialized = false;
        this.changedSince = false;
        this.currentlySaving = false;

        this.lastLoad = moment();
        this.lastSave = moment();
        this.loadCooldown = 10;
        this.saveCooldown = 10;
    }

    get configuration() {
        return this._configuration;
    }

    set configuration(value) {
        this._configuration = value;
    }

    get(path) {
        return _.get(this.configuration, path);
    }

    async mergeRecursive(obj1, obj2, embeded = undefined) {
        var _this = this;
        var startTimer = moment();
        var updated = [];
        if (this.verbose && typeof embeded == "undefined")MainLog.log(`[RecursiveMerger] Starting recursive merging [${moment().diff(startTimer)}ms]`);
        for (var p in obj2) {
            try {
                if (obj2[p].constructor == Object){
                    let mergeRecursiveEmbeded = await _this.mergeRecursive(obj1[p], obj2[p], startTimer);
                    if (mergeRecursiveEmbeded.updated) updated.push(true);
                    obj1[p] = mergeRecursiveEmbeded.result;
                } else {
                    switch (typeof obj1[p]) {
                        case typeof obj2[p]:
                            break;

                        case "undefined":
                            if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] is an not defined, creating it with value [${obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                            obj1[p] = obj2[p];
                            updated.push(true);
                            break;
                    
                        default:
                            if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] has the wrong type, switching from [${typeof obj1[p]}] to [${typeof obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                            obj1[p] = obj2[p];
                            updated.push(true);
                            break;
                    }
                }
            } catch (e) {
                if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] is missing, creating it with value [${obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                obj1[p] = obj2[p];
                updated.push(true);
            }
        }
        return { result: obj1, updated: updated.includes(true) };
    }

    async initialize(createIfNonExistant = false, Dependency: TobyBot | Guild | TobyBotUser = undefined) {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing ${this.constructor.name} [${moment().diff(startTimer)}ms]`);

        if (Dependency) {
            this.Dependency = Dependency;
            if ((Dependency as Guild | TobyBotUser).TobyBot) {
                this.SQLPool = (Dependency as Guild | TobyBotUser).TobyBot.SQLPool;
            } else {
                this.SQLPool = (Dependency as TobyBot).SQLPool;
            }
        }
        
        let loaded = await this.load(true);

        if (!loaded) {
            if (!createIfNonExistant) return false;
            if (typeof this.Dependency != "undefined"){
                await this.Dependency.createInSQL().then(async () => {
                    await this.load(true).then(loaded => {
                        if (!loaded) throw new UnknownError('Could not load configuration').logError();
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
            this.SQLPool.query(`UPDATE \`${this.SQLTable}\` SET \`backups\`=? WHERE ${this.SQLWhere}`, [entryBackup], async function (error, results, _fields) {
                if (error) throw error;
                res(true);
            });
        });
    }

    async save(bypass = true): Promise<Boolean> {
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

        return new Promise(async (res, rej) => {
            this.SQLPool.query(`SELECT * FROM ${this.SQLTable} WHERE ${this.SQLWhere}`, async (error, results) => {
                if (error) throw error;
                if (results.length == 0)return res(false);

                try {
                    results = JSON.parse(results[0][this.SQLcolumn]);
                } catch (e) {
                    if (this.verbose) MainLog.log(`Could not fetch configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                    return res(this.save());
                }
                if (this.verbose) MainLog.log(`Fetched configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
                this.configuration = await this.versionChecking(results);
                res(true);
            });
        });
    }

    async versionChecking (configuration) {
        return configuration;
    }
}