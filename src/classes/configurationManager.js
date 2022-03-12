//Import Node modules
const mysql = require(`mysql`);
const _ = require('lodash');

const Logger = require(`./Logger`);

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class configuationManager {
    constructor(client, sqlConfiguration, fallbackFile, sqlTable = `guildsConfigurations`, sqlWhere = `\`numId\` = 1`, guildId = undefined) {
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
        if (this.verbose)MainLog.log(`Initializing configuration`);
        let requestResult = await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (this.verbose)MainLog.log(`Connected to SQL`);
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                if (this.verbose)MainLog.log(`Fecthing configuration`);
                connection.query(`SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`, async function (error, results, fields) {
                    if (typeof results != "undefined" && results.length == 1) {
                        if (this.verbose)MainLog.log(`Configuration fetched.`);
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
                        try { connection.release() } catch (e) {}
                        res(true);
                    } else if (typeof zisse.guildId != "undefined") {
                        connection.query(`INSERT INTO ${zisse.sqlTable} (\`guildId\`) VALUES ('${zisse.guildId}')`, async function (error, results, fields) {
                            if (results.affectedRows != 1) ErrorLog.log(`Did not insert for some reason wth. ${error.toString()}`);
                            try { connection.release() } catch (e) {}
                            if (error) {
                                ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                                res(false);
                            }
                            res(null);
                        });
                    }
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                });
            });
        });
        if (requestResult == null) return await this.initialize();
        if (requestResult == false) return false;
        await this.checkForMissingKeys();
        await this.save(true);
        this.initialized = requestResult;
        return true;
    }

    async load(bypass = false) {
        if ((!this.initialized || this.isSaving) || bypass) return;
        if (this.verbose)MainLog.log(`Loading configuration`);
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                if (this.verbose)MainLog.log(`Connected to SQL`);
                if (this.verbose)MainLog.log(`Fecthing configuration`);
                connection.query(`SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`, async function (error, results, fields) {
                    if (this.verbose)MainLog.log(`Configuration fetched.`);
                    if (typeof results == "object" && results.length != 0) {
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
                        try { connection.release() } catch (e) {}
                        res(true);
                    } else {
                        console.log(error, results, fields)
                        MainLog.log(`results is undefined or its length is 0 for SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`);
                        MainLog.log(`Check for potential issue`);
                        try { connection.release() } catch (e) {}
                        res(false);
                    }
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                });
            });
        });
    }

    async save(bypass = false) {
        if ((!this.initialized || this.isSaving) && !bypass) return;
        if (this.verbose)MainLog.log(`Saving configuration.`);
        let zisse = this;
        this.isSaving = true;
        let configurationToPush = this.configuration;
        let sqlString = `UPDATE \`${this.sqlTable}\` SET &[SQLVALUESTOSET]${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`;
        let sqlValues = [];
        let sqlPlaceholders = [];
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
        let requestResult = await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                if (this.verbose)MainLog.log(`Connected to SQL`);
                if (this.verbose)MainLog.log(`Pushing configuration`);
                connection.query(`${sqlString.replace(`&[SQLVALUESTOSET]`, sqlPlaceholders.join(','))}`, sqlValues, async function (error, results, fields) {
                    if (typeof results.affectedRows == "number" && results.affectedRows == 0) {
                        try { connection.release() } catch (e) {}
                        res(false);
                    }
                    try { connection.release() } catch (e) {}
                    res(true);
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                });
            });
        });
        if (requestResult == null) {
            await this.initialize();
            await this.save();
        }
        this.isSaving = false;
        return true;
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
        this.save();
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
                if (typeof obj1[p] == "undefined")obj1[p] = obj2[p];
            }
        } catch (e) {
            //MainLog.log(`Creating missing config key [${p}] as [${obj2[p]}].`);
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}