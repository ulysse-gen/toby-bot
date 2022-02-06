//Import Node modules
const mysql = require(`mysql`);
const {
    Discord,
    Permissions
} = require(`discord.js`);


const Logger = require(`./Logger`);
const { result } = require('lodash');

//Loggers
const MainLog = new Logger();

module.exports = class permissionsManager {
    constructor(client, sqlConfiguration, fallbackFile, sqlTable = `guildsPermissions`, sqlWhere = `\`numId\` = 1`, guildId = undefined) {
        this.client = client;
        this.sqlConfiguration = require('../../MySQL.json');
        this.sqlTable = sqlTable;
        this.sqlWhere = sqlWhere;
        this.guildId = guildId;

        this.permissions = {};
        this.fallbackFile = fallbackFile;

        this.initialized = false;
        this.isSaving = false;
        this.verbose = false;

        this.neverAllow = [
            "commands.impossiblecommand",
            "*"
        ];

        this.neverAllowGuildFocused = [
            "commands.globalpermissions",
            "commands.globalconfiguration"
        ]
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
                            zisse.permissions[iterator] = jsonFormat;
                        } catch (e) {
                            zisse.permissions[iterator] = results[0][iterator];
                        }
                    }
                    res(true);
                } else if (typeof zisse.guildId != "undefined") {
                    connection.query(`INSERT INTO ${zisse.sqlTable} (\`guildId\`) VALUES ('${zisse.guildId}')`, async function (error, results, fields) {
                        if (error) res(false);
                        if (results.affectedRows != 1) console.log(`premissionsManager SQL error, afftected 0 rows`);
                        res(true);
                    });
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
                if (typeof results == "undefined"){
                    MainLog.log(`results is undefined for SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`);
                    MainLog.log(`Check for potential issue`);
                }
                if (typeof results == "undefined")res(false);
                if (results.length == 0){
                    MainLog.log(`results length is 0 for SELECT * FROM ${zisse.sqlTable}${(typeof zisse.sqlWhere != "undefined") ? ` WHERE ${zisse.sqlWhere}` : ``}`);
                    MainLog.log(`Check for potential issue`);
                }
                if (results.length == 0)res(false);
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
                res(true);
            });
        });
        await requestPromise;
        return requestPromise;
    }

    async save(bypass = false) {
        if ((!this.initialized || this.isSaving) || bypass) return;
        let zisse = this;
        this.isSaving = true;
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

    async getUserPermissions(userId, isAdmin = false) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.permissions.users[userId] == "object" && Object.keys(this.permissions.users[userId]).length >= 1) {
            return this.permissions.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        }
        await this.load(); //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.permissions.users[userId] == "object" && Object.keys(this.permissions.users[userId]).length >= 1) {
            return this.permissions.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        }
        if (this.guildId == "global") {
            if (typeof this.permissions.users[userId] != "object") this.permissions.users[userId] = {
                "internalRole.default": true
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

        if (this.guildId == "global") {
            this.permissions.internalRoles[internalRole] = {
                "*": false
            }; //This runs if user has no permissions stored, create user perm with default value (empty)                                                                                //Create new perms for internalRole
            this.save();
            return this.permissions.internalRoles[internalRole]; //Return newly created data
        }
        return {};
    }

    async getRolePermission(guildId, roleId, isAdmin = false) { //I dont have patience to comment but its the same as the two other just going nested
        if (!this.initialized) return {};
        if (typeof this.permissions.roles[guildId] == "object" && Object.keys(this.permissions.roles[guildId]).length >= 1)
            if (typeof this.permissions.roles[guildId][roleId] == "object" && Object.keys(this.permissions.roles[guildId][roleId]).length >= 1) {
                if ((isAdmin && this.guildId == "global") && (typeof this.permissions.roles[guildId][roleId]["*"] != "boolean" || this.permissions.roles[guildId][roleId]["*"] != true)) {
                    this.permissions.roles[guildId][roleId]["*"] = true;
                    this.save();
                }
                return this.permissions.roles[guildId][roleId];
            }
        await this.load();
        if (typeof this.permissions.roles[guildId] == "object" && Object.keys(this.permissions.roles[guildId]).length >= 1)
            if (typeof this.permissions.roles[guildId][roleId] == "object" && Object.keys(this.permissions.roles[guildId][roleId]).length >= 1) {
                if ((isAdmin && this.guildId == "global") && (typeof this.permissions.roles[guildId][roleId]["*"] != "boolean" || this.permissions.roles[guildId][roleId]["*"] != true)) {
                    this.permissions.roles[guildId][roleId]["*"] = true;
                    this.save();
                }
            }

        if (this.guildId == "global") {
            if (typeof this.permissions.roles[guildId] != "object") this.permissions.roles[guildId] = {};
            if (typeof this.permissions.roles[guildId][roleId] != "object") this.permissions.roles[guildId][roleId] = (isAdmin && this.guildId == "global") ? {
                "*": true
            } : {};
            if ((isAdmin && this.guildId == "global") && (typeof this.permissions.roles[guildId][roleId]["*"] != "boolean" || this.permissions.roles[guildId][roleId]["*"] != true)) this.permissions.roles[guildId][roleId]["*"] = true;
            this.save();
            return this.permissions.roles[guildId][roleId];
        }
    }

    async getChannelPermission(guildId, channelId) { //I dont have patience to comment but its the same as the one just above but with channel insteal of role
        if (!this.initialized) return {};
        if (typeof this.permissions.channels[guildId] == "object" && Object.keys(this.permissions.channels[guildId]).length >= 1)
            if (typeof this.permissions.channels[guildId][channelId] == "object" && Object.keys(this.permissions.channels[guildId][channelId]).length >= 1) return this.permissions.channels[guildId][channelId];
        await this.load();
        if (typeof this.permissions.channels[guildId] == "object" && Object.keys(this.permissions.channels[guildId]).length >= 1)
            if (typeof this.permissions.channels[guildId][channelId] == "object" && Object.keys(this.permissions.channels[guildId][channelId]).length >= 1) return this.permissions.channels[guildId][channelId];

        if (this.guildId == "global") {
            if (typeof this.permissions.channels[guildId] != "object") this.permissions.channels[guildId] = {};
            this.permissions.channels[guildId][channelId] = {
                "internalRole.default": true
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

        if (this.guildId == "global") {
            this.permissions.guilds[guildId] = {
                "internalRole.default": true
            };
            this.save();
            return this.permissions.guilds[guildId];
        }
        return {};
    }

    async userHasPermission(permission, userId, userRoles = undefined, channelId = undefined, guildId = undefined, canReturnNull = false) {
        if (!this.initialized) return false;
        let zisse = this; //Just making a link to "this" to access it in nested functions. Yes, in french i read "zisse" as "this"
        if (this.neverAllow.includes(permission)) return false; //If the permission is in the "never allow".. then dont allow. Seems obvious huh ?
        if (this.neverAllowGuildFocused.includes(permission) && this.guildId == "global") return false; //If the permission is in the "never allow".. then dont allow. Seems obvious huh ?
        let userPermissions = await this.getUserPermissions(userId); //Call for the user permissions**

        let permissionCheckingPromise = new Promise(async (res, rej) => { //This is a thing to be able to wait for it to process before returning the value, thanks javascript its terrible, allow for async execution tho
            let permissionCheckingPromise_User = new Promise(async (res, rej) => {
                this.client.guilds.fetch(guildId).then(async fethedGuild => {
                    fethedGuild.members.fetch(userId).then(async fetchedUser => {
                        let isAdmin = await fetchedUser.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true);
                        let userPermissions = await this.getUserPermissions(userId, isAdmin); //Call for the user permissions**
                        let isPermissionGranted = await this.isPermissionGranted(userPermissions, permission); //Check if permissions is granted, if yes, return true just below****
                        if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][USER]Permission ${permission} => ${isPermissionGranted}`);
                        res(isPermissionGranted);
                    }).catch(e => {
                        MainLog.log(`Could not fetch user ${userId} Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch user ${userId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                }).catch(e => {
                    MainLog.log(`Could not fetch guild ${guildId} Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild ${guildId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
            });
            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][USER]Begining permission check`);
            let isPermissionGranted_User = await permissionCheckingPromise_User; //Exec the nested "thing to be able to wait for it to process before returning the value"
            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][USER]Permission => ${isPermissionGranted_User}`);
            if (isPermissionGranted_User != null) res(isPermissionGranted_User);

            let permissionCheckingPromise_InternalRole = new Promise(async (res, rej) => { //What i am doing here is aweful, honnestly its terrible (nested "thing to be able to wait for it to process before returning the value")
                if (Object.keys(userPermissions).length == 0) res(null);
                let control = Object.keys(userPermissions).length;
                for (const key in userPermissions) {
                    if (key.startsWith(`internalRole.`)) {
                        let internalRolesPermissions = await zisse.getInternalRolePermissions(key.replace(`internalRole.`, ``)); //Same as ** just above
                        let isPermissionGranted = await this.isPermissionGranted(internalRolesPermissions, permission); //Same as **** just above
                        if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][INTERNALROLE]Permission ${permission} => ${isPermissionGranted}`);
                        if (isPermissionGranted != null) res(isPermissionGranted);
                    }
                    control--;
                    if (control == 0) res(null);
                }
            });
            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][INTERNALROLE]Begining permission check`);
            let isPermissionGranted_InternalRole = await permissionCheckingPromise_InternalRole; //Exec the nested "thing to be able to wait for it to process before returning the value"
            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][INTERNALROLE]Permission => ${isPermissionGranted_InternalRole}`);
            if (isPermissionGranted_InternalRole != null) res(isPermissionGranted_InternalRole);

            let permissionCheckingPromise_Role = new Promise(async (res, rej) => { //What i am doing here is aweful, honnestly its terrible (nested "thing to be able to wait for it to process before returning the value")
                if ([typeof userId, typeof guildId].includes("undefined")) res(null);
                this.client.guilds.fetch(guildId).then(fethedGuild => {
                    fethedGuild.members.fetch(userId).then(fetchedUser => {
                        let control = fetchedUser.roles.cache.size;
                        fetchedUser.roles.cache.forEach(async indRole => {
                            let isAdmin = await indRole.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true);
                            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][ROLE]Role ${indRole.id}@${guildId} (${isAdmin})`);
                            let rolePermissions = await this.getRolePermission(guildId, indRole.id, isAdmin); //Same as ** just above
                            let isPermissionGranted = await this.isPermissionGranted(rolePermissions, permission); //Same as **** just above
                            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][ROLE]Permission ${permission} => ${isPermissionGranted}`);
                            if (isPermissionGranted != null) res(isPermissionGranted);
                            control--;
                            if (control == 0) res(null);
                        });
                    }).catch(e => {
                        MainLog.log(`Could not fetch user ${userId} Error : ${e}`.red); //Logging in file & console
                        if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch user ${userId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                    });
                }).catch(e => {
                    MainLog.log(`Could not fetch guild ${guildId} Error : ${e}`.red); //Logging in file & console
                    if (typeof guild != "undefined" && guild.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild ${guildId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                });
            });
            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][ROLE]Begining permission check`);
            let isPermissionGranted_Role = await permissionCheckingPromise_Role; //Exec the nested "thing to be able to wait for it to process before returning the value"
            if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][ROLE]Permission => ${isPermissionGranted_Role}`);
            if (isPermissionGranted_Role != null) res(isPermissionGranted_Role);

            if (typeof channelId == "string") {
                let channelPermissions = await this.getChannelPermission(guildId, channelId); //Same as ** just above
                if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][CHANNEL]Begining permission check`);
                let isPermissionGranted = await this.isPermissionGranted(channelPermissions, permission); //Same as **** just above
                if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][CHANNEL]Permission => ${isPermissionGranted}`);
                if (isPermissionGranted != null) res(isPermissionGranted);
            }

            if (typeof guildId == "string") {
                let guildPermissions = await this.getGuildPermissions(guildId); //Same as ** just above
                if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][GUILD]Begining permission check`);
                let isPermissionGranted = await this.isPermissionGranted(guildPermissions, permission); //Same as **** just above
                if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][GUILD]Permission => ${isPermissionGranted}`);
                if (isPermissionGranted != null) res(isPermissionGranted);
            }
            res((canReturnNull) ? null : false);
        });
        let isPermissionGranted = await permissionCheckingPromise; //Wait for the promise ("thing to be able to wait for it to process before returning the value") to resolve
        return isPermissionGranted;
    }


    async isPermissionGranted(permissionArray, permission) { //Just a quick function to prevent writing the same code in a loop
        if (!this.initialized) return null;
        if (typeof permissionArray != "object") return null;
        if (Object.keys(permissionArray).length == 0) return null;
        let permissionModified = permission.split('.');
        permissionModified.pop();
        let mustCheckNested = [`*`, permission, `${permission}.*`, `${permissionModified.join('.')}.*`];
        let nestedCheck = permission.split('.');
        let nestedCheckPass = `${nestedCheck.shift()}`;

        let checkerPromise = new Promise((res, rej) => {
            let totalResults = [];
            nestedCheck.forEach(nestedPoss => {
                mustCheckNested.push(`${nestedCheckPass}.*`)
                nestedCheckPass += `.${nestedPoss}`;
            });
            let left = mustCheckNested.length;
            mustCheckNested.forEach(permToCheck => {
                if (typeof permissionArray[permToCheck] != undefined)
                    if (typeof permissionArray[permToCheck] == "boolean") {
                        if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][PERMISSION GRANT]${permToCheck} => ${permissionArray[permToCheck]}`);
                        totalResults.push(permissionArray[permToCheck]);
                    }
                left--;
                if (left == 0) res((totalResults.includes(false) ? false : (totalResults.includes(true) ? true : null)));
            });
        });
        return await checkerPromise;
    }

    async checkForMissingKeys() {
        let defaultPermissions = require(this.fallbackFile);
        let currentPermissions = this.permissions;
        let newPermissions = await mergeRecursive(currentPermissions, defaultPermissions);
        this.permissions = newPermissions;
        this.save();
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