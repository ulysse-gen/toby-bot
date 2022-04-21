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

        this.lastLoad = undefined;
        this.loadCooldown = 10;
    }

    async initialize() {
        let zisse = this;
        let startTimer = moment();
        return new Promise(async (res, _rej) => {
            if (zisse.verbose) MainLog.log(`Initializing configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
            res(zisse.load(true));
        }).then(loaded => new Promise(async (res, _rej) => {
            if (!loaded) {
                if (zisse.verbose) MainLog.log(`Could not load configuration, creating it and re trying. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                return res(zisse.insertGuildInSQL().then(() => zisse.load(true)));
            }
            res(true);
        })).then(initialized => new Promise(async (res, _rej) => {
            if (!initialized) {
                if (zisse.verbose) MainLog.log(`Could not initialize configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                return res(false);
            }
            if (zisse.verbose) MainLog.log(`Initialized configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
            zisse.initialized = true;
            res(true);
        }));
    }

    async load(bypass = false) {
        let zisse = this;
        let startTimer = moment();
        if ((!this.initialized || this.isSaving) && !bypass) return false;
        if (!bypass && (typeof this.lastLoad != "undefined" && moment().diff(this.lastLoad, "seconds") <= this.loadCooldown)) return true;
        this.lastLoad = moment();
        if (this.verbose) MainLog.log(`Loading configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        if (this.verbose) MainLog.log(`Fecthing configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        return new Promise(async (res, _rej) => {
            zisse.sqlPool.query(`SELECT * FROM ${zisse.sqlTable} WHERE ${zisse.sqlWhere}`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    return res(null);
                }
                if (typeof results == "undefined" || results.length != 1) {
                    if (zisse.verbose) MainLog.log(`Could not fetch configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    return res(false);
                }
                if (zisse.verbose) MainLog.log(`Fetched configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                try {
                    zisse.configuration = JSON.parse(results[0].main);
                } catch (e) {
                    MainLog.log(`Error in configuration JSON. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    return res(null);
                }
                if (zisse.verbose) MainLog.log(`Loaded configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                let updatedConfig = await zisse.integrityChecher((zisse.sqlWhere != `\`numId\` = 1`) ? results[0] : undefined);
                if (updatedConfig) {
                    if (zisse.verbose) MainLog.log(`Config has been updated, saving new config. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    await zisse.save(true);
                }
                res(true);
            })
        });
    }

    async save(bypass = false) {
        let zisse = this;
        let startTimer = moment();
        if ((!this.initialized || this.isSaving) && !bypass) return false;
        this.isSaving = true;
        if (this.verbose) MainLog.log(`Saving configuration. [${this.sqlTable} => ${this.sqlWhere}][${moment().diff(startTimer)}ms]`);
        return new Promise(async (res, _rej) => {
            zisse.sqlPool.query(`UPDATE \`${this.sqlTable}\` SET \`main\`=? WHERE ${this.sqlWhere}`, [JSON.stringify(zisse.configuration)], async function (error, results, _fields) {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    return res(null);
                }
                if (typeof results == "undefined" || results.affectedRows != 1) {
                    if (zisse.verbose) MainLog.log(`Could not save configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                    return res(false);
                }
                if (zisse.verbose) MainLog.log(`Saved configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}][${moment().diff(startTimer)}ms]`);
                zisse.isSaving = false;
                res(true);
            });
        });
    }

    async insertGuildInSQL() {
        let zisse = this;
        return new Promise(async (res, _rej) => {
            zisse.sqlPool.query(`INSERT INTO ${zisse.sqlTable} (\`guildId\`) VALUES ('${zisse.guildId}')`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    return res(null);
                }
                if (results.affectedRows != 1) {
                    MainLog.log(`Could not create the configuration. ${error.toString()}`);
                    return res(false);
                }
                if (zisse.verbose) MainLog.log(`Created configuration. [${zisse.sqlTable} => ${zisse.sqlWhere}]`);
                res(true);
            });
        });
    }

    async set(path, value) {
        _.set(this.configuration, path, value);
        return this.save();
    }

    async delete(path) {
        _.unset(this.configuration, path);
        return this.save();
    }

    get(path) {
        return _.get(this.configuration, path);
    }



    async integrityChecher(configTransitionCheck) {
        let defaultConfiguration = require(this.fallbackFile);
        let currentConfiguration = JSON.parse(JSON.stringify(this.configuration));
        let checkResult = await mergeRecursive(currentConfiguration, defaultConfiguration, true);
        let transitionChecker = (typeof configTransitionCheck != "undefined") ? await this.configTransition(configTransitionCheck) : false;
        this.configuration = checkResult.result;
        return ([checkResult.updated, transitionChecker].includes(true));
    }

    async configTransition(SQLResult) {
        let zisse = this;
        if (typeof SQLResult.prefix != "undefined")return new Promise((res, _rej) => {
            let prefixCheck = new Promise((res, _rej) => {
                if (SQLResult.prefix != "") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`prefix\`=? WHERE ${zisse.sqlWhere}`, [""], async function (error, results, _fields) {
                        zisse.configuration.prefix = SQLResult.prefix;
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let colorsCheck = new Promise((res, _rej) => {
                if (SQLResult.colors != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`colors\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.colors = JSON.parse(SQLResult.colors);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let behaviourCheck = new Promise((res, _rej) => {
                if (SQLResult.behaviour != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`behaviour\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.behaviour = JSON.parse(SQLResult.behaviour);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let autokickCheck = new Promise((res, _rej) => {
                if (SQLResult.autokick != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`autokick\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.autokick = JSON.parse(SQLResult.autokick);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let roleaddedCheck = new Promise((res, _rej) => {
                if (SQLResult.roleadder != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`roleadder\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.roleadder = JSON.parse(SQLResult.roleadder);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let moderationCheck = new Promise((res, _rej) => {
                if (SQLResult.moderation != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`moderation\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.moderation = JSON.parse(SQLResult.moderation);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let lockdownCheck = new Promise((res, _rej) => {
                if (SQLResult.lockdown != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`lockdown\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.lockdown = JSON.parse(SQLResult.lockdown);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });

            Promise.all([prefixCheck, colorsCheck, behaviourCheck, autokickCheck, roleaddedCheck, moderationCheck, lockdownCheck]).then((values) => res(values.includes(true)));
        });
        if (typeof SQLResult.internalRoles != "undefined")return new Promise((res, _rej) => {
            let usersCheck = new Promise((res, _rej) => {
                if (SQLResult.users != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`users\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.users = JSON.parse(SQLResult.users);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let internalRolesCheck = new Promise((res, _rej) => {
                if (SQLResult.internalRoles != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`internalRoles\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.internalRoles = JSON.parse(SQLResult.internalRoles);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let rolesCheck = new Promise((res, _rej) => {
                if (SQLResult.roles != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`roles\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.roles = JSON.parse(SQLResult.roles);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let channelsCheck = new Promise((res, _rej) => {
                if (SQLResult.channels != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`channels\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.channels = JSON.parse(SQLResult.channels);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let guildCheck = new Promise((res, _rej) => {
                if (SQLResult.guilds != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`guilds\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.guilds = JSON.parse(SQLResult.guilds);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });

            Promise.all([usersCheck, internalRolesCheck, rolesCheck, channelsCheck, guildCheck]).then((values) => res(values.includes(true)));
        });
        if (typeof SQLResult.sharedEmbeds != "undefined")return new Promise((res, _rej) => {
            let userEmbedsCheck = new Promise((res, _rej) => {
                if (SQLResult.userEmbeds != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`userEmbeds\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.userEmbeds = JSON.parse(SQLResult.userEmbeds);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });
            let sharedEmbedsCheck = new Promise((res, _rej) => {
                if (SQLResult.sharedEmbeds != "{}") {
                    zisse.sqlPool.query(`UPDATE \`${zisse.sqlTable}\` SET \`sharedEmbeds\`=? WHERE ${zisse.sqlWhere}`, ["{}"], async function (error, results, _fields) {
                        zisse.configuration.sharedEmbeds = JSON.parse(SQLResult.sharedEmbeds);
                        res(true);
                    });
                } else {
                    res(false);
                }
            });

            Promise.all([userEmbedsCheck, sharedEmbedsCheck]).then((values) => res(values.includes(true)));
        });
    }
}

async function mergeRecursive(obj1, obj2, returnWithUpdateCheck = false, verbose = false) {
    if (verbose) MainLog.log(`[RecursiveMerger]Starting to merge.`);
    let updated = false;
    for (var p in obj2) {
        try {
            if (obj2[p].constructor == Object) {
                obj1[p] = await mergeRecursive(obj1[p], obj2[p]);
            } else {
                if (typeof obj1[p] == "undefined") {
                    if (verbose) MainLog.log(`[RecursiveMerger] [${p}] is an not defined, creating it with value [${obj2[p]}].`);
                    obj1[p] = obj2[p];
                    updated = true;
                }
                if (typeof obj1[p] != typeof obj2[p]) {
                    if (verbose) MainLog.log(`[RecursiveMerger] [${p}] has the wrong type, switching from [${typeof obj1[p]}] to [${typeof obj2[p]}].`);
                    obj1[p] = obj2[p];
                    updated = true;
                }

            }
        } catch (e) {
            if (verbose) MainLog.log(`[RecursiveMerger] [${p}] is missing, creating it.`);
            obj1[p] = obj2[p];
            updated = true;
        }
    }
    return (returnWithUpdateCheck) ? {
        result: obj1,
        updated: updated
    } : obj1;
}