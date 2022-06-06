/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const { Permissions } = require('discord.js');
const _ = require('lodash');

//Importing classes
const FileLogger = require('./FileLogger');
const SQLConfigurationManager = require('./SQLConfigurationManager');

//Creating objects
const MainLog = new FileLogger();

module.exports = class SQLPermissionManager extends SQLConfigurationManager {
    constructor(SQLConnectionInfos, SQLTable, SQLWhere = `\`numId\` = 1`, SQLColumn = 'permissions', defaultConfig = {}) {
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

        this.allowDevOnly = [
            "command.eval"
        ];

        this.neverAllow = [
            "command.impossible",
            "*",
            "command.eval"
        ];

        this.neverAllowGuildFocused = [
            "command.globalpermissions",
            "command.globalconfiguration",
            "command.reloadcommands",
            "command.senddm"
        ];
    }

    get permissions() {
        return this.configuration;
    }

    set permissions(value) {
        this.configuration = value;
    }

    get configuration() {
        return this._configuration;
    }

    set configuration(value) {
        this._configuration = value;
    }

    async getUserPermissions(userId, isAdmin = null) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.users[userId] == "object" && Object.keys(this.configuration.users[userId]).length >= 1)return this.configuration.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        await this.load(); //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.configuration.users[userId] == "object" && Object.keys(this.configuration.users[userId]).length >= 1)return this.configuration.users[userId]; //Check if user permissions are in cache & if its not empty, return it
        return {};
    }

    async getInternalRolePermissions(internalRole) {
        if (!this.initialized) return {}; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.internalRoles[internalRole] == "object" && Object.keys(this.configuration.internalRoles[internalRole]).length >= 1) return this.configuration.internalRoles[internalRole]; //Check if internalRole permissions are in cache & if its not empty, return it                           
        await this.load() //This only runs if the permissions cached were empty, load from file in case any update have applied to the file & cache it
        if (typeof this.configuration.internalRoles[internalRole] == "object" && Object.keys(this.configuration.internalRoles[internalRole]).length >= 1) return this.configuration.internalRoles[internalRole]; //Check newly cached data
        return {};
    }

    async getRolePermissions(guildId, roleId, isAdmin = null) {
        if (!this.initialized) return {};
        if (isAdmin){
            if (typeof this.configuration.roles[guildId] != "object")this.configuration.roles[guildId] = {};
            if (typeof this.configuration.roles[guildId][roleId] != "object")this.configuration.roles[guildId][roleId] = {};
            if (typeof this.configuration.roles[guildId][roleId]['*'] != "object"){
                this.configuration.roles[guildId][roleId]['*'] = {value: true, priority: 0, temporary: false};
                this.changedSince = true;
            }
        }else {
            if (typeof this.configuration.roles[guildId] == "object" && typeof this.configuration.roles[guildId][roleId] == "object")
                if(typeof this.configuration.roles[guildId][roleId]['*'] != "undefined"){
                    delete this.configuration.roles[guildId][roleId]['*'];
                    this.changedSince = true;
                }
        }
        if (typeof this.configuration.roles[guildId] == "object" && typeof this.configuration.roles[guildId][roleId] == "object" && Object.keys(this.configuration.roles[guildId][roleId]).length >= 1){
            return this.configuration.roles[guildId][roleId];
        }
        await this.load();
        if (typeof this.configuration.roles[guildId] == "object" && typeof this.configuration.roles[guildId][roleId] == "object" && Object.keys(this.configuration.roles[guildId][roleId]).length >= 1){
            return this.configuration.roles[guildId][roleId];
        }
        return {};
    }

    async getRolesPermissions(guildId, rolesArray){
        let rolesPermissions = [];
        for (const role of rolesArray.values()) {
            rolesPermissions.push(await this.getRolePermissions(guildId, role.id, await role.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true)));
        }
        return rolesPermissions.flat();
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

    async userHasPermission(permission, guildUser, channel = undefined, useAdmin = false) {
        if (typeof guildUser != "object") throw new Error('Wrong type.')
        let isAdmin = (useAdmin) ? await guildUser.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true) : false;
        let permissions = [await this.getUserPermissions(guildUser.id, isAdmin), await this.getChannelPermission(channel.guild.id, channel.id), await this.getGuildPermissions(channel.guild.id), await this.getRolesPermissions(channel.guild.id, guildUser.roles.cache, isAdmin)];
        let finalPermissions = {};
        for (const indPermission of permissions.flat()) {
            _.mergeWith(finalPermissions, indPermission, (v1, v2) => {
                if (typeof v1 == "undefined")return (typeof v2 == "undefined") ? undefined : v2;
                if (typeof v2 == "undefined")return (typeof v1 == "undefined") ? undefined : v1;
                return (v1.priority >= v2.priority) ? v1 : v2;
            });
        }
        let isPermissionGrantedResult = await this.isPermissionGranted(finalPermissions, permission);
        if (this.changedSince) this.save();
        return isPermissionGrantedResult;
    }

    async isPermissionGranted(permissionArray, permission) { //Just a quick function to prevent writing the same code in a loop
        if (!this.initialized) return false;
        if (typeof permissionArray != "object") throw new Error('Wrong type.')
        if (Object.keys(permissionArray).length == 0) return false;
        let totalResults = [];
        let permissionModified = permission.split('.');
        let addThis = `${permissionModified.shift()}.*`;
        let mustCheckNested = [`*`];
        permissionModified.forEach(element => {
            mustCheckNested.push(addThis);
            addThis = addThis.replace(`.*`, `.${element}.*`);
        });
        mustCheckNested.push(permission);
        mustCheckNested.push(addThis);
        if (mustCheckNested.length == 0) return false;
        for (const permToCheck of mustCheckNested) {
            if (typeof permissionArray[permToCheck] != "undefined"){
                if (typeof permissionArray[permToCheck] == "boolean")permissionArray[permToCheck] = {value: permissionArray[permToCheck], priority: 0, temporary: false}
                if (typeof permissionArray[permToCheck] == "object"){
                    permissionArray[permToCheck] = Object.assign({value: false, priority: 0, temporary: false}, permissionArray[permToCheck]);
                    if (this.verbose) MainLog.log(`[Permission Verbose][${(this.guildId == "global")}][PERMISSION GRANT]${permToCheck} => ${permissionArray[permToCheck].value}`);
                    totalResults.push(permissionArray[permToCheck]);
                }
            }
        }
        totalResults.sort((indPerm1, indPerm2) => indPerm2.priority - indPerm1.priority);
        let finalResults = totalResults.filter(indPerm => indPerm.priority == totalResults[0].priority);
        let finalBooleans = finalResults.map(indPerm => indPerm.value);
        return finalBooleans.includes(false) ? false : (finalBooleans.includes(true) ? true : null);
    }
}