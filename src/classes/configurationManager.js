//Import Node modules
const mysql = require(`mysql`);
const _ = require('lodash');

const Logger = require(`./Logger`);

//Loggers
const MainLog = new Logger();

module.exports = class configuationManager {
    constructor(client, sqlConfiguration, fallbackFile, sqlTable = `guildsConfigurations`, sqlWhere = `\`numId\` = 1`, guildId = undefined) {
        this.client = client;
        this.sqlConfiguration = require('../../MySQL.json');
        this.sqlTable = sqlTable;
        this.sqlWhere = sqlWhere;
        this.guildId = guildId;

        this.configuration = {};
        this.fallbackFile = fallbackFile;

        this.initialized = false;
        this.isSaving = false;
    }

    async initialize() {
        let zisse = this;
        let connection = mysql.createConnection(this.sqlConfiguration);
        connection.connect();
        let requestPromise = new Promise((res, rej) => {
            connection.query(`SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`, async function (error, results, fields) {
                connection.end();
                if (error) res(false);
                if (results.length == 1) {
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
                    res(true);
                } else if (typeof zisse.guildId != "undefined") {
                    connection.query(`INSERT INTO ${zisse.sqlTable} (\`guildId\`) VALUES ('${zisse.guildId}')`, async function (error, results, fields) {
                        connection.end();
                        if (error) res(false);
                        if (results.affectedRows != 1) console.log(`configurationManager SQL error, afftected 0 rows`);
                        res(true);
                    });
                    res(true);
                }
            });
        });
        let requestResult = await requestPromise;
        if (requestResult == null) return await this.initialize();
        if (requestResult == false) return false;
        await this.checkForMissingKeys();
        await this.save(true);
        this.initialized = requestResult;
        return true;
    }

    async load(bypass = false) {
        if ((!this.initialized || this.isSaving) || bypass) return;
        let zisse = this;
        let connection = mysql.createConnection(this.sqlConfiguration);
        connection.connect();
        let requestPromise = new Promise((res, rej) => {
            connection.query(`SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`, async function (error, results, fields) {
                connection.end();
                if (error) res(false);
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
                res(true);
            });
        });
        await requestPromise;
        return requestPromise;
    }

    async save(bypass = false) {
        if ((!this.initialized || this.isSaving) && !bypass) return;
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
        let connection = mysql.createConnection(this.sqlConfiguration);
        let requestPromise = new Promise((res, rej) => {
            connection.query(`${sqlString.replace(`&[SQLVALUESTOSET]`, sqlPlaceholders.join(','))}`, sqlValues, async function (error, results, fields) {
                connection.end();
                if (error) res(false);
                if (typeof results.affectedRows == "number" && results.affectedRows == 0) res(null);
                res(true);
            });
            
        });
        let requestResult = await requestPromise;
        if (requestResult == null) {
            await this.initialize();
            await this.save();
        }
        this.isSaving = false;
        return requestPromise;
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
        let newConfiguration = await mergeRecursive(currentConfiguration, defaultConfiguration);
        this.configuration = newConfiguration;
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
                if (typeof obj1[p] != typeof obj2[p]) obj1[p] = obj2[p];
                //if (typeof obj1[p] != "undefined")obj1[p] = obj2[p];
            }
        } catch (e) {
            //MainLog.log(`Creating missing config key [${p}] as [${obj2[p]}].`);
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}