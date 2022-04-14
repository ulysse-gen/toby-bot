//Import Node modules
const mysql = require(`mysql`);
const _ = require('lodash');
const moment = require('moment');

const Logger = require(`./Logger`);

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class configuationManager {
    constructor(client, fallbackFile, sqlTable = `guildsConfigurations`, sqlWhere = `\`numId\` = 1`, guildId = undefined) {
        this.client = client;
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
        this.sqlTable = sqlTable;
        this.sqlWhere = sqlWhere;
        this.guildId = guildId;
        this.verbose = false;

        this.configuration = {};
        this.fallbackFile = fallbackFile;

        this.initialized = false;
        this.isSaving = false;
    }

    async initialize() {
        let zisse = this;
        let startTimer = moment();
        if (this.verbose) MainLog.log(`Initializing configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        if (this.verbose) MainLog.log(`Fecthing configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        return new Promise((res, rej) => {
            zisse.sqlPool.query(`SELECT * FROM ${zisse.sqlTable} WHERE ${zisse.sqlWhere}`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    return res(null);
                }
                if (typeof results == "undefined" || results == null || results.length != 1) {
                    if (zisse.verbose) MainLog.log(`Could not fetch configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    return res(zisse.sqlPool.query(`INSERT INTO ${zisse.sqlTable} (\`guildId\`) VALUES ('${zisse.guildId}')`, async (error, results) => {
                        if (error) {
                            ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                            return res(null);
                        }
                        if (results.affectedRows != 1) {
                            MainLog.log(`Could not create the configuration. ${error.toString()}[${moment().diff(startTimer)}ms]`);
                            return res(false);
                        }
                        if (zisse.verbose) MainLog.log(`Created configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                        return res(zisse.initialize());
                    }));
                }
                if (zisse.verbose) MainLog.log(`Fetched configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                delete results[0].numId;
                delete results[0].guildId;
                for (let iterator in results[0]) {
                    try {
                        let jsonFormat = JSON.parse(results[0][iterator]);
                        zisse.configuration[iterator] = jsonFormat;
                    } catch (e) {
                        zisse.configuration[iterator] = results[0][iterator];
                    }
                }
                await zisse.checkForMissingKeys();
                await zisse.save(true);
                zisse.initialized = true;
                if (zisse.verbose) MainLog.log(`Initialized configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                res(true);
            });
        });
    }

    async load(bypass = false) {
        let zisse = this;
        let startTimer = moment();
        if ((!this.initialized || this.isSaving) || bypass) return false;
        if (this.verbose) MainLog.log(`Loading configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        if (this.verbose) MainLog.log(`Fecthing configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        return new Promise((res, rej) => {
            zisse.sqlPool.query(`SELECT * FROM ${zisse.sqlTable} WHERE ${zisse.sqlWhere}`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    res(null);
                }
                if (typeof results == "undefined" || results.length != 1) {
                    if (zisse.verbose) MainLog.log(`Could not fetch configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    res(false);
                }
                if (zisse.verbose) MainLog.log(`Fetched configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                delete results[0].numId;
                delete results[0].guildId;
                for (let iterator in results[0]) {
                    try {
                        let jsonFormat = JSON.parse(results[0][iterator]);
                        zisse.configuration[iterator] = jsonFormat;
                    } catch (e) {
                        zisse.configuration[iterator] = results[0][iterator];
                    }
                }
                if (zisse.verbose) MainLog.log(`Loaded configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                res(true);
            });
        });
    }

    async save(bypass = false) {
        let zisse = this;
        let startTimer = moment();
        if ((!this.initialized || this.isSaving) || bypass) return false;
        if (this.verbose) MainLog.log(`Saving configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        this.isSaving = true;
        let configurationToPush = this.configuration;
        let sqlString = `UPDATE \`${this.sqlTable}\` SET &[SQLVALUESTOSET] WHERE ${this.sqlWhere}`;
        let sqlValues = [];
        let sqlPlaceholders = [];
        if (this.verbose) MainLog.log(`Preparing configuration saving. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        for (let iterator in configurationToPush) {
            if (typeof configurationToPush[iterator] == "object") {
                try {
                    let valueToSet = JSON.stringify(configurationToPush[iterator]);
                    sqlValues.push(valueToSet);
                    sqlPlaceholders.push(`\`${iterator}\`=?`);
                } catch (e) {
                    let valueToSet = configurationToPush[iterator];
                    sqlValues.push(valueToSet);
                    sqlPlaceholders.push(`\`${iterator}\`=?`);
                }
            } else {
                let valueToSet = configurationToPush[iterator];
                sqlValues.push(valueToSet);
                sqlPlaceholders.push(`\`${iterator}\`=?`);
            }
        }
        if (this.verbose) MainLog.log(`Started configuration saving. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        return new Promise((res, rej) => {
            zisse.sqlPool.query(`${sqlString.replace(`&[SQLVALUESTOSET]`, sqlPlaceholders.join(','))}`, sqlValues, async function (error, results, _fields) {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    res(false);
                }
                if (typeof results == "undefined" || results.affectedRows != 1) {
                    if (zisse.verbose) MainLog.log(`Could not save configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    await zisse.initialize();
                    res(zisse.save(true));
                }
                if (zisse.verbose) MainLog.log(`Saved configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                zisse.isSaving = false;
                res(true);
            });
        });
    }

    set(path, value) {
        _.set(this.configuration, path, value);
        this.save();
        return true;
    }

    get(path) {
        return _.get(this.configuration, path);
    }


    async checkForMissingKeys() {
        let defaultConfiguration = require(this.fallbackFile);
        let currentConfiguration = this.configuration;
        this.configuration = await mergeRecursive(currentConfiguration, defaultConfiguration);
        return true;
    }
}

async function mergeRecursive(obj1, obj2) {
    for (var p in obj2) {
        try {
            if (obj2[p].constructor == Object) {
                obj1[p] = await mergeRecursive(obj1[p], obj2[p]);
            } else {
                if (typeof obj1[p] == "undefined") MainLog.log(`Creating missing config key [${p}] as [${obj2[p]}].`);
                //if (typeof obj1[p] != typeof obj2[p]) MainLog.log(`Wat key [${p}] as [${obj2[p]}].`);
                if (typeof obj1[p] != typeof obj2[p]) obj1[p] = obj2[p];
                if (typeof obj1[p] == "undefined") obj1[p] = obj2[p];
            }
        } catch (e) {
            //MainLog.log(`Creating missing config key [${p}] as [${obj2[p]}].`);
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}