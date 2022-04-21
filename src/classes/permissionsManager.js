//Import Node modules
const mysql = require(`mysql`);
const _ = require('lodash');
const moment = require('moment');
const {
    Discord,
    Permissions
} = require(`discord.js`);

const Logger = require(`./Logger`);
const configurationManager = require(`./configurationManager`);

//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class permissionsManager extends configurationManager {
    constructor(client, fallbackFile, sqlTable = `guildsPermissions`, sqlWhere = `\`numId\` = 1`, guildId = undefined) {
        super(client, fallbackFile, sqlTable, sqlWhere, guildId);

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

    set(path, value) {
        _.set(this.configuration, path, value);
        this.save();
        return true;
    }

    get(path) {
        return _.get(this.configuration, path);
    }

    async getUserPermissions(userId, isAdmin = false) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.users[userId] == "object" && Object.keys(this.configuration.users[userId]).length >= 1) {
            return this.configuration.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        }
        await this.load(); //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.configuration.users[userId] == "object" && Object.keys(this.configuration.users[userId]).length >= 1) {
            return this.configuration.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        }
        return {};
    }

    async getInternalRolePermissions(internalRole) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.internalRoles[internalRole] == "object" && Object.keys(this.configuration.internalRoles[internalRole]).length >= 1) return this.configuration.internalRoles[internalRole]; //Check if internalRole permissions are in cache & if its not empty, return it                           
        await this.load() //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.configuration.internalRoles[internalRole] == "object" && Object.keys(this.configuration.internalRoles[internalRole]).length >= 1) return this.configuration.internalRoles[internalRole]; //Check newly cached data
        return {};
    }

    async getRolePermission(guildId, roleId, isAdmin = false) { //I dont have patience to comment but its the same as the two other just going nested
        if (!this.initialized) return {};
        if (typeof this.configuration.roles[roleId] == "object" && Object.keys(this.configuration.roles[roleId]).length >= 1) {
            if ((isAdmin && typeof this.guildId != "undefined") && (typeof this.configuration.roles[roleId]["*"] != "object" || this.configuration.roles[roleId]["*"].value != true)) {
                this.configuration.roles[roleId]["*"] = {
                    value: true,
                    priority: 0,
                    temporary: false
                };
            }
            return this.configuration.roles[roleId];
        }
        await this.load();
        if (typeof this.configuration.roles[roleId] == "object" && Object.keys(this.configuration.roles[roleId]).length >= 1) {
            if ((isAdmin && typeof this.guildId != "undefined") && (typeof this.configuration.roles[roleId]["*"] != "object" || this.configuration.roles[roleId]["*"].value != true)) {
                this.configuration.roles[roleId]["*"] = {
                    value: true,
                    priority: 0,
                    temporary: false
                };
            }
        }
        if (typeof this.guildId != "undefined") {
            if (isAdmin && typeof this.configuration.roles[roleId] != "object") this.configuration.roles[roleId] = {
                "*": {
                    value: true,
                    priority: 0,
                    temporary: false
                }
            };
            return this.configuration.roles[roleId];
        }
        return {};
    }

    async getChannelPermission(guildId, channelId) { //I dont have patience to comment but its the same as the one just above but with channel insteal of role
        if (!this.initialized) return {};
        if (typeof this.configuration.channels[guildId] == "object" && Object.keys(this.configuration.channels[guildId]).length >= 1)
            if (typeof this.configuration.channels[guildId][channelId] == "object" && Object.keys(this.configuration.channels[guildId][channelId]).length >= 1) return this.configuration.channels[guildId][channelId];
        await this.load();
        if (typeof this.configuration.channels[guildId] == "object" && Object.keys(this.configuration.channels[guildId]).length >= 1)
            if (typeof this.configuration.channels[guildId][channelId] == "object" && Object.keys(this.configuration.channels[guildId][channelId]).length >= 1) return this.configuration.channels[guildId][channelId];
        return {};
    }

    async getGuildPermissions(guildId) { //Same as for user & internal role but with guild instead
        if (!this.initialized) return {};
        if (typeof this.configuration.guilds[guildId] == "object" && Object.keys(this.configuration.guilds[guildId]).length >= 1) return this.configuration.guilds[guildId];
        await this.load();
        if (typeof this.configuration.guilds[guildId] == "object" && Object.keys(this.configuration.guilds[guildId]).length >= 1) return this.configuration.guilds[guildId];
        return {};
    }

    async userHasPermission(permission, userId, userRoles = undefined, channelId = undefined, guildId = undefined, canReturnNull = false) {
        if (!this.initialized) return false;
        let zisse = this; //Just making a link to "this" to access it in nested functions. Yes, in french i read "zisse" as "this"
        if (this.allowDev.includes(permission) && ["231461358200291330"].includes(userId)) return true; //If the permission is in the "allow dev" & the user that typed the command is dev.. then allow. Seems obvious huh ?
        if (this.neverAllow.includes(permission)) return false; //If the permission is in the "never allow".. then dont allow. Seems obvious huh ?
        if (this.neverAllowGuildFocused.includes(permission) && this.guildId == "global") return false; //If the permission is in the "never allow".. then dont allow. Seems obvious huh ?
        let guildUser = await this.client.guilds.fetch(guildId).then(async fethedGuild => {
            return fethedGuild.members.fetch(userId).then(fetchedUser => {
                return fetchedUser;
            }).catch(e => {
                MainLog.log(`Could not fetch user ${userId} Error : ${e}`.red); //Logging in file & console
                if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch user ${userId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
                return undefined;
            });
        }).catch(e => {
            MainLog.log(`Could not fetch guild ${guildId} Error : ${e}`.red); //Logging in file & console
            if (typeof guild != "undefined" && guild.configurationManager.configuration.behaviour.logDiscordErrors && guild.logToChannel.initialized) guild.channelLog(`[ERR] Could not fetch guild ${guildId} Error : \`${e}\``); //Loggin in log channel if logDiscordErrors is set & the log channel is initialized
            return undefined;
        });
        if (typeof guildUser == "undefined") return false;
        let isAdmin = await guildUser.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true);

        let fullPermissions = await new Promise(async (res, _rej) => {
            let permissionsGot = [];
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for permissions`);
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for user permissions`);
            permissionsGot.push(await zisse.getUserPermissions(userId, isAdmin));
            if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for internalRole permissions`);
            await new Promise(async (res, _rej) => { //What i am doing here is aweful, honnestly its terrible (nested "thing to be able to wait for it to process before returning the value")
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
            await new Promise(async (res, _rej) => { //What i am doing here is aweful, honnestly its terrible (nested "thing to be able to wait for it to process before returning the value")
                let control = guildUser.roles.cache.size;
                guildUser.roles.cache.forEach(async indRole => {
                    if (zisse.verbose) MainLog.log(`[Permission Verbose][${(zisse.guildId == "global")}][FULL]Scanning for role ${indRole.id}@${guildId} (${isAdmin}) permissions`);
                    permissionsGot.push(await zisse.getRolePermission(guildId, indRole.id, await indRole.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true)));
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
        return new Promise(async (res, rej) => { //This is a thing to be able to wait for it to process before returning the value, thanks javascript its terrible, allow for async execution tho
            let finalPermissionArray = {};
            let control = fullPermissions.length;
            if (control == 0) res((canReturnNull) ? null : false);
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
        return checkerPromise;
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

function getPermName(bitfield = 0) {
    for (let key in Discord.Permissions.FLAGS)
        if (Discord.Permissions.FLAGS[key] == bitfield) return key;
    return null;
}