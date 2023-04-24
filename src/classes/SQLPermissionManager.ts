/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
import { Collection, GuildMember, Permissions, Role, TextChannel } from 'discord.js';
import _ from 'lodash';
import { TypeError } from './Errors';

//Importing classes
import FileLogger from './FileLogger';
import SQLConfigurationManager from './SQLConfigurationManager';

//Creating objects
const MainLog = new FileLogger();

export default class SQLPermissionManager extends SQLConfigurationManager {
    constructor(SQLTable, SQLWhere = `\`numId\` = 1`, SQLColumn = 'permissions', defaultConfig: {} | string = {}, neverAutoChange = false) {
        super(SQLTable, SQLWhere, SQLColumn, defaultConfig);

        this.SQLPool = undefined;
        this.SQLTable = SQLTable;
        this.SQLWhere = SQLWhere;
        this.SQLcolumn = SQLColumn;

        this._configuration = defaultConfig;
        this.defaultConfiguration = (typeof defaultConfig == "object") ? defaultConfig : JSON.parse(defaultConfig as string);

        this.initialized = false;
        this.changedSince = false;
        this.neverAutoChange = neverAutoChange;

        this.allowDevOnly = [
            "command.evaluate"
        ];

        this.neverAllow = [
            "command.impossible",
            "*",
            "command.evaluate"
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

    async getUserPermissions(userId: string, isAdmin = null) {
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

    async getRolePermissions(guildId: string, roleId: string, isAdmin = null) {
        if (!this.initialized) return {};
        if (isAdmin){
            if (typeof this.configuration.roles[guildId] != "object")this.configuration.roles[guildId] = {};
            if (typeof this.configuration.roles[guildId][roleId] != "object")this.configuration.roles[guildId][roleId] = {};
            if (typeof this.configuration.roles[guildId][roleId]['*'] != "object" && !this.neverAutoChange){
                this.configuration.roles[guildId][roleId]['*'] = {value: true, priority: 0, temporary: false};
                this.changedSince = true;
            }
        }else {
            if (typeof this.configuration.roles[guildId] == "object" && typeof this.configuration.roles[guildId][roleId] == "object")
                if(typeof this.configuration.roles[guildId][roleId]['*'] != "undefined" && !this.neverAutoChange){
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

    async getRolesPermissions(guildId: string, rolesArray: Collection<string, Role>){
        return Promise.all(rolesArray.map(async (Role: Role) => this.getRolePermissions(guildId, Role.id, Role.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true))));
    }

    async getChannelPermission(guildId: string, channelId: string) { //I dont have patience to comment but its the same as the one just above but with channel insteal of role
        if (!this.initialized) return {};
        if (typeof this.configuration.channels[guildId] == "object" && Object.keys(this.configuration.channels[guildId]).length >= 1)
            if (typeof this.configuration.channels[guildId][channelId] == "object" && Object.keys(this.configuration.channels[guildId][channelId]).length >= 1) return this.configuration.channels[guildId][channelId];
        await this.load();
        if (typeof this.configuration.channels[guildId] == "object" && Object.keys(this.configuration.channels[guildId]).length >= 1)
            if (typeof this.configuration.channels[guildId][channelId] == "object" && Object.keys(this.configuration.channels[guildId][channelId]).length >= 1) return this.configuration.channels[guildId][channelId];
        return {};
    }

    async getGuildPermissions(guildId: string) { //Same as for user & internal role but with guild instead
        if (!this.initialized) return {};
        if (typeof this.configuration.guilds[guildId] == "object" && Object.keys(this.configuration.guilds[guildId]).length >= 1) return this.configuration.guilds[guildId];
        await this.load();
        if (typeof this.configuration.guilds[guildId] == "object" && Object.keys(this.configuration.guilds[guildId]).length >= 1) return this.configuration.guilds[guildId];
        return {};
    }

    async setUserPermission(userId: string, permissionKey: string, permissionValue = true, permissionPriority = 0, permissionTemporary = false){
        if (!this.initialized) return false; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.users[userId] != "object")this.configuration.users[userId] = {};
        this.configuration.users[userId][permissionKey] = {value: permissionValue, priority: permissionPriority, temporary: permissionTemporary}
        return this.save();
    }

    async deleteUserPermission(userId: string, permissionKey: string){
        if (!this.initialized) return false; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.users[userId] != "object")this.configuration.users[userId] = {};
        if (typeof this.configuration.users[userId][permissionKey] != "undefined") delete this.configuration.users[userId][permissionKey];
        return this.save();
    }

    async setRolePermission(guildId: string, roleId: string, permissionKey: string, permissionValue = true, permissionPriority = 0, permissionTemporary = false){
        if (!this.initialized) return false; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.roles[guildId] != "object")this.configuration.roles[guildId] = {};
        if (typeof this.configuration.roles[guildId][roleId] != "object")this.configuration.roles[guildId][roleId] = {};
        this.configuration.roles[guildId][roleId][permissionKey] = {value: permissionValue, priority: permissionPriority, temporary: permissionTemporary}
        return this.save();
    }

    async deleteRolePermission(guildId: string, roleId: string, permissionKey: string){
        if (!this.initialized) return false; //If the permissionManager is not initialized, return an enmpty permission array
        if (typeof this.configuration.roles[guildId] != "object")this.configuration.roles[guildId] = {};
        if (typeof this.configuration.roles[guildId][roleId] != "object")this.configuration.roles[guildId][roleId] = {};
        if (typeof this.configuration.roles[guildId][roleId][permissionKey] != "undefined") delete this.configuration.roles[guildId][roleId][permissionKey];
        return this.save();
    }

    async userHasPermission(permission: string, guildUser: GuildMember, channel: TextChannel = undefined, useAdmin = false) {
        if (!(guildUser instanceof GuildMember)) throw new TypeError('Wrong type.');
        if (this.allowDevOnly.includes(permission) && guildUser.user.id == "231461358200291330")return true;
        if (this.neverAllow.includes(permission))return false;
        if (this.neverAllowGuildFocused.includes(permission) && useAdmin)return false;
        let isAdmin = (useAdmin) ? guildUser.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true) : false;
        let permissions = await Promise.all([this.getUserPermissions(guildUser.id, isAdmin), this.getChannelPermission(channel.guild.id, channel.id), this.getGuildPermissions(channel.guild.id), this.getRolesPermissions(channel.guild.id, guildUser.roles.cache)]);
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
        if (typeof permissionArray != "object") throw new TypeError('Wrong type.');
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
                if (typeof permissionArray[permToCheck] == "object"){
                    permissionArray[permToCheck] = Object.assign({value: false, priority: 0, temporary: false}, permissionArray[permToCheck]);
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