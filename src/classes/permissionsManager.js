//Import Node modules
const mysql = require(`mysql`);
const {
    Discord,
    Permissions
} = require(`discord.js`);


const Logger = require(`./Logger`);
const _ = require('lodash');

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class permissionsManager {
    constructor(client, sqlConfiguration, fallbackFile, sqlTable = `guildsPermissions`, sqlWhere = `\`numId\` = 1`, guildId = undefined) {
        this.client = client;
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
        this.sqlTable = sqlTable;
        this.sqlWhere = sqlWhere;
        this.guildId = guildId;

        this.permissions = {};
        this.fallbackFile = fallbackFile;

        this.initialized = false;
        this.isSaving = false;
        this.verbose = false;

        this.allowDev = [
            "commands.eval"
        ]

        this.neverAllow = [
            "commands.impossiblecommand",
            "*",
            "commands.eval"
        ];

        this.neverAllowGuildFocused = [
            "commands.globalpermissions",
            "commands.globalconfiguration",
            "commands.reloadcommands",
            "commands.senddm"
        ]
    }

    async initialize() {
        let zisse = this;
        if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Initializing permissions`);
        let requestResult = await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`, async function (error, results, fields) {
                    if (typeof results != "undefined" && results.length == 1) {
                        delete results[0].numId;
                        delete results[0].guildId;
                        for (let iterator in results[0]) {
                            try {
                                zisse.permissions[iterator] = JSON.parse(results[0][iterator]);
                            } catch (e) {
                                zisse.permissions[iterator] = results[0][iterator];
                            }
                        }
                        try {
                            connection.release()
                        } catch (e) {}
                        res(true);
                    } else if (typeof zisse.guildId != "undefined") {
                        connection.query(`INSERT INTO ${zisse.sqlTable} (\`guildId\`) VALUES ('${zisse.guildId}')`, async function (error, results, fields) {
                            if (results.affectedRows != 1) ErrorLog.log(`Did not insert for some reason wth. ${error.toString()}`);
                            try {
                                connection.release()
                            } catch (e) {}
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
        this.initialized = requestResult;
        await this.save();
        return true;
    }

    async load(bypass = false) {
        if ((!this.initialized || this.isSaving) || bypass) return;
        let zisse = this;
        return await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`, async function (error, results, fields) {
                    if (typeof results == "object" && results.length != 0) {
                        delete results[0].numId;
                        delete results[0].guildId;
                        for (let iterator in results[0]) {
                            try {
                                let jsonFormat = JSON.parse(results[0][iterator]);
                                zisse.permissions[iterator] = jsonFormat;
                            } catch (e) {
                                zisse.permissions[iterator] = results[0][iterator];
                            }
                        }
                        try {
                            connection.release()
                        } catch (e) {}
                        res(true);
                    } else {
                        console.log(error, results, fields)
                        MainLog.log(`results is undefined or its length is 0 for SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`);
                        MainLog.log(`Check for potential issue`);
                        try {
                            connection.release()
                        } catch (e) {}
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
        if ((!this.initialized || this.isSaving) || bypass) return;
        let zisse = this;
        let permissionsToPush = this.permissions;
        let sqlString = `UPDATE \`${this.sqlTable}\` SET &[SQLVALUESTOSET]${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`;
        let sqlValues = [];
        let sqlPlaceholders = [];
        for (let iterator in permissionsToPush) {
            if (typeof permissionsToPush[iterator] == "object") {
                try {
                    let valueToSet = JSON.stringify(permissionsToPush[iterator]);
                    sqlValues.push(valueToSet);
                    sqlPlaceholders.push(`\`${iterator}\`=?`);
                } catch (e) {
                    let valueToSet = permissionsToPush[iterator];
                    sqlValues.push(valueToSet);
                    sqlPlaceholders.push(`\`${iterator}\`=?`);
                }
            } else {
                let valueToSet = permissionsToPush[iterator];
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
                connection.query(`${sqlString.replace(`&[SQLVALUESTOSET]`, sqlPlaceholders.join(','))}`, sqlValues, async function (error, results, fields) {
                    if (typeof results.affectedRows == "number" && results.affectedRows == 0) {
                        try {
                            connection.release()
                        } catch (e) {}
                        res(null);
                    }
                    try {
                        connection.release()
                    } catch (e) {}
                    res(true);
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                });
            });
        });
        if (requestResult == null) return await this.initialize();
        this.isSaving = false;
        return true;
    }

    async getUserPermissions(userId, isAdmin = false) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.permissions.users[userId] == "object" && Object.keys(this.permissions.users[userId]).length >= 1) {
            return this.permissions.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        }
        await this.load(); //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.permissions.users[userId] == "object" && Object.keys(this.permissions.users[userId]).length >= 1) {
            return this.permissions.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        }
        if (typeof this.guildId != "undefined" && false) {
            if (typeof this.permissions.users[userId] != "object") this.permissions.users[userId] = {
                "internalRole.default": {
                    value: true,
                    priority: 0,
                    temporary: false
                }
            };
            this.save();
            return this.permissions.users[userId]; //Return newly created data
        }
        return {};
    }

    async getInternalRolePermissions(internalRole) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.permissions.internalRoles[internalRole] == "object" && Object.keys(this.permissions.internalRoles[internalRole]).length >= 1) return this.permissions.internalRoles[internalRole]; //Check if internalRole permissions are in cache & if its not empty, return it                           
        await this.load() //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.permissions.internalRoles[internalRole] == "object" && Object.keys(this.permissions.internalRoles[internalRole]).length >= 1) return this.permissions.internalRoles[internalRole]; //Check newly cached data
        return {};
    }

    async getRolePermission(guildId, roleId, isAdmin = false) { //I dont have patience to comment but its the same as the two other just going nested
        if (!this.initialized) return {};
        if (typeof this.permissions.roles[roleId] == "object" && Object.keys(this.permissions.roles[roleId]).length >= 1) {
            if ((isAdmin && typeof this.guildId != "undefined") && (typeof this.permissions.roles[roleId]["*"] != "object" || this.permissions.roles[roleId]["*"].value != true)) {
                this.permissions.roles[roleId]["*"] = {
                    value: true,
                    priority: 0,
                    temporary: false
                };
            }
            return this.permissions.roles[roleId];
        }
        await this.load();
        if (typeof this.permissions.roles[roleId] == "object" && Object.keys(this.permissions.roles[roleId]).length >= 1) {
            if ((isAdmin && typeof this.guildId != "undefined") && (typeof this.permissions.roles[roleId]["*"] != "object" || this.permissions.roles[roleId]["*"].value != true)) {
                this.permissions.roles[roleId]["*"] = {
                    value: true,
                    priority: 0,
                    temporary: false
                };
            }
        }
        if (typeof this.guildId != "undefined") {
            if (isAdmin && typeof this.permissions.roles[roleId] != "object") this.permissions.roles[roleId] = {
                "*": {
                    value: true,
                    priority: 0,
                    temporary: false
                }
            };
            return this.permissions.roles[roleId];
        }
        return {};
    }

    async getChannelPermission(guildId, channelId) { //I dont have patience to comment but its the same as the one just above but with channel insteal of role
        if (!this.initialized) return {};
        if (typeof this.permissions.channels[guildId] == "object" && Object.keys(this.permissions.channels[guildId]).length >= 1)
            if (typeof this.permissions.channels[guildId][channelId] == "object" && Object.keys(this.permissions.channels[guildId][channelId]).length >= 1) return this.permissions.channels[guildId][channelId];
        await this.load();
        if (typeof this.permissions.channels[guildId] == "object" && Object.keys(this.permissions.channels[guildId]).length >= 1)
            if (typeof this.permissions.channels[guildId][channelId] == "object" && Object.keys(this.permissions.channels[guildId][channelId]).length >= 1) return this.permissions.channels[guildId][channelId];

        if (typeof this.guildId != "undefined" && false) {
            if (typeof this.permissions.channels[guildId] != "object") this.permissions.channels[guildId] = {};
            this.permissions.channels[guildId][channelId] = {
                "internalRole.default": {
                    value: true,
                    priority: 0,
                    temporary: false
                }
            };
            this.save();
            return this.permissions.channels[guildId][channelId];
        }
        return {};
    }

    async getGuildPermissions(guildId) { //Same as for user & internal role but with guild instead
        if (!this.initialized) return {};
        if (typeof this.permissions.guilds[guildId] == "object" && Object.keys(this.permissions.guilds[guildId]).length >= 1) return this.permissions.guilds[guildId];
        await this.load();
        if (typeof this.permissions.guilds[guildId] == "object" && Object.keys(this.permissions.guilds[guildId]).length >= 1) return this.permissions.guilds[guildId];

        if (typeof this.guildId != "undefined" && false) {
            /*this.permissions.guilds[guildId] = {
                "internalRole.default": {
                    value: true,
                    priority: 0,
                    temporary: false
                }
            };
            this.save();
            return this.permissions.guilds[guildId];*/
        }
        return {};
    }

    async userHasPermission(permission, userId, userRoles = undefined, channelId = undefined, guildId = undefined, canReturnNull = false) {
        if (!this.initialized) return false;
        let zisse = this; //Just making a link to "this" to access it in nested functions. Yes, in french i read "zisse" as "this"
        if (this.allowDev.includes(permission) && ["231461358200291330"].includes(userId)) return true; //If the permission is in the "allow dev" & the user that typed the command is dev.. then allow. Seems obvious huh ?
        if (this.neverAllow.includes(permission)) return false; //If the permission is in the "never allow".. then dont allow. Seems obvious huh ?
        if (this.neverAllowGuildFocused.includes(permission) && this.guildId == "global") return false; //If the permission is in the "never allow".. then dont allow. Seems obvious huh ?
        let guildUser = await this.client.guilds.fetch(guildId).then(async fethedGuild => {
            return await fethedGuild.members.fetch(userId).then(fetchedUser => {
                return fetchedUser;
            }).catch(e => {
                MainLog.log(`Could not fetch user ${userId} Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch user ${userId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                return undefined;
            });
        }).catch(e => {
            MainLog.log(`Could not fetch guild ${guildId} Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild ${guildId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            return undefined;
        });
        if (typeof guildUser == "undefined") return false;
        let isAdmin = await guildUser.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true);

        let fullPermissions = await new Promise(async (res, rej) => {
            let permissionsGot = [];
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for permissions`);
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for user permissions`);
            permissionsGot.push(await zisse.getUserPermissions(userId, isAdmin));
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for internalRole permissions`);
            await new Promise(async (res, rej) => { //What i am doing here is aweful, honnestly its terrible (nested "thing to be able to wait for it to process before returning the value")
                if (Object.keys(permissionsGot[0]).length == 0) res(true);
                let control = Object.keys(permissionsGot[0]).length;
                for (const key in permissionsGot[0]) {
                    if (key.startsWith(`internalRole.`)) {
                        if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for ${key} permissions`);
                        permissionsGot.push(await zisse.getInternalRolePermissions(key.replace(`internalRole.`, ``)));
                    }
                    control--;
                    if (control == 0) res(true);
                }
            });
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for role permissions`);
            await new Promise(async (res, rej) => { //What i am doing here is aweful, honnestly its terrible (nested "thing to be able to wait for it to process before returning the value")
                let control = guildUser.roles.cache.size;
                guildUser.roles.cache.forEach(async indRole => {
                    if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for role ${indRole.id}@${guildId} (${isAdmin}) permissions`);
                    permissionsGot.push(await zisse.getRolePermission(guildId, indRole.id, isAdmin));
                    control--;
                    if (control == 0) res(true);
                });
            });
            if (typeof channelId == "string") permissionsGot.push(await zisse.getChannelPermission(guildId, channelId));
            if (typeof channelId == "string") permissionsGot.push(await zisse.getGuildPermissions(guildId));
            res(permissionsGot)
        });
        if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Grabbed permissions`);
        if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Checking for permission grant`);
        let isPermissionGranted = await new Promise(async (res, rej) => { //This is a thing to be able to wait for it to process before returning the value, thanks javascript its terrible, allow for async execution tho
            let finalPermissionArray = {};
            let control = fullPermissions.length;
            if (control == 0)res((canReturnNull) ? null : false);
            fullPermissions.forEach(async element => {
                _.mergeWith(finalPermissionArray, element, (val1, val2) => {
                    if (typeof val1 == "undefined") {
                        if (typeof val2 == "undefined") return undefined;
                        if (typeof val2 != "undefined") return val2;
                    }
                    if (typeof val2 == "undefined") {
                        if (typeof val1 == "undefined") return undefined;
                        if (typeof val1 != "undefined") return val1;
                    }
                    return (val1.priority >= val2.priority) ? val1 : val2;
                });
                control--;
                if (control == 0) {
                    let isPermissionGranted = await zisse.isPermissionGranted(finalPermissionArray, permission);
                    res((isPermissionGranted == true) ? true : (canReturnNull) ? null : false);
                }
            });
        });
        return isPermissionGranted;
    }


    async isPermissionGranted(permissionArray, permission) { //Just a quick function to prevent writing the same code in a loop
        if (!this.initialized) return null;
        if (typeof permissionArray != "object") return null;
        if (Object.keys(permissionArray).length == 0) return null;
        let zisse = this;
        let permissionModified = permission.split('.');
        let addThis = `${permissionModified.shift()}.*`;
        let mustCheckNested = [`*`];
        permissionModified.forEach(element => {
            mustCheckNested.push(addThis);
            addThis = addThis.replace(`.*`, `.${element}.*`);
        });
        mustCheckNested.push(permission);
        mustCheckNested.push(addThis);
        let checkerPromise = new Promise((res, rej) => {
            if (mustCheckNested.length == 0) res(null);
            let totalResults = [];
            let left = mustCheckNested.length;
            mustCheckNested.forEach(permToCheck => {
                if (typeof permissionArray[permToCheck] != "undefined") {
                    if (typeof permissionArray[permToCheck] == "boolean") { //To process the switch to the new permission system
                        permissionArray[permToCheck] = {
                            value: permissionArray[permToCheck],
                            priority: 0,
                            temporary: false
                        };
                    }
                    if (typeof permissionArray[permToCheck] == "object") {
                        if (typeof permissionArray[permToCheck].value == "boolean") {
                            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][PERMISSION GRANT]${permToCheck} => ${permissionArray[permToCheck].value}`);
                            totalResults.push(permissionArray[permToCheck]);
                        }
                    }
                }
                left--;
                if (left == 0) {
                    if (totalResults.length == 0) res(null);
                    totalResults.sort((indPerm1, indPerm2) => indPerm2.priority - indPerm1.priority);
                    let finalResults = totalResults.filter(indPerm => indPerm.priority == totalResults[0].priority);
                    let finalBooleans = finalResults.map(indPerm => indPerm.value);
                    res((finalBooleans.includes(false) ? false : (finalBooleans.includes(true) ? true : null)));
                }
            });
        });
        return await checkerPromise;
    }

    async checkForMissingKeys() {
        let defaultPermissions = require(this.fallbackFile);
        let currentPermissions = this.permissions;
        this.permissions = await mergeRecursive(currentPermissions, defaultPermissions);
        return true;
    }
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function mergeRecursive(obj1, obj2) {
    for (var p in obj2) {
        try {
            if (obj2[p].constructor == Object) {
                obj1[p] = mergeRecursive(obj1[p], obj2[p]);
            } else {
                if (typeof obj1[p] == "undefined") MainLog.log(`Creating missing perm key [${p}] as [${obj2[p]}].`);
                //if (typeof obj1[p] != typeof obj2[p]) MainLog.log(`Wat key [${p}] as [${obj2[p]}].`);
                if (typeof obj1[p] != typeof obj2[p]) obj1[p] = obj2[p];
                if (typeof obj1[p] == "undefined") obj1[p] = obj2[p];
            }
        } catch (e) {
            //MainLog.log(`???? ${p} [${typeof obj2[p]}][${obj1[p]}][${obj2[p]}]`);
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}

function getPermName(bitfield = 0) {
    for (let key in Discord.Permissions.FLAGS)
        if (Discord.Permissions.FLAGS[key] == bitfield) return key;
    return null;
}