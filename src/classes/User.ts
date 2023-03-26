/////////////////////////////////
//User is the main class for Users
/////////////////////////////////

import { User as DiscordUser } from "discord.js";
import { SQLError } from "./Errors";

//Importing NodeJS modules
const mysql = require(`mysql`);
const { I18n } = require('i18n');
const urlExists = require('url-exists');

//Importing classes
import SQLConfigurationManager from "./SQLConfigurationManager";
import TobyBot from "./TobyBot";
import UserManager from "./UserManager";

export default class User {
    TobyBot: TobyBot;
    UserManager: UserManager;
    User: DiscordUser;
    id: string;
    initialized: boolean;
    ConfigurationManager: SQLConfigurationManager;
    permissionLevel: number;
    numId: number;
    password: string;
    avatar: string;
    constructor(UserManager: UserManager, user: DiscordUser) {
        this.TobyBot = UserManager.TobyBot;
        this.UserManager = UserManager;
        this.User = user;
        this.id = user.id;

        this.initialized = false;
    }

    apiVersion (){
        if (!this.initialized)return undefined;
        let apiVersion = {
            id: this.id,
            user: this.User,
            configuration: this.ConfigurationManager.configuration,
            permissionLevel: this.permissionLevel
        };
        return apiVersion;
    }

    tokenVersion () {
        if (!this.initialized)return undefined;
        let tokenVersion = {
            id: this.id,
            permissionLevel: this.permissionLevel
        };
        return tokenVersion;
    }

    async initialize(createIfNonExistant = false) {
        this.ConfigurationManager = new SQLConfigurationManager('users', `\`id\` = '${this.User.id}'`, undefined, require('/app/configurations/defaults/UserConfiguration.json'));
        await this.ConfigurationManager.initialize(createIfNonExistant, undefined, this);
        await this.loadSQLContent();
        this.initialized = true;
        return true;
    }

    async loadSQLContent(checkForUpdate = false) {
        return new Promise((res, _rej) => {
            this.UserManager.SQLPool.query(`SELECT * FROM \`users\` WHERE id='${this.User.id}'`, (error, results) => {
                if (error)throw error;
                if (results.length != 0){
                    this.numId = results[0].numId;
                    this.password = results[0].password;
                    this.permissionLevel = results[0].permissionLevel;
                    if (checkForUpdate && JSON.stringify(this.ConfigurationManager.configuration) != results[0].configuration)this.ConfigurationManager.load();
                    res(true)
                }
                res(true);
            });
        });
    }

    async createInSQL() {
        return new Promise((res, _rej) => {
            this.UserManager.SQLPool.query(`SELECT * FROM \`users\` WHERE id='${this.User.id}'`, (error, results) => {
                if (error)throw new SQLError('Could not select user from the database.', {cause: error}).logError();
                if (results.length == 0){
                    this.UserManager.SQLPool.query(`INSERT INTO \`users\` (id, configuration) VALUES (?,?)`, [this.User.id, JSON.stringify(require('/app/configurations/defaults/UserConfiguration.json'))], async (error, results) => {
                        if (error)throw new SQLError('Could not insert user in the database.', {cause: error}).logError();
                        if (results.affectedRows != 1) throw new SQLError('Could not insert user in the database.').logError();
                        res(true);
                    });
                }else {
                    res(true);
                }
            });
        });
    }

    async getUserPfp(publicOnly = false) {
        if (typeof this.User.avatar == "undefined" && typeof this.avatar == "undefined") return `https://tobybot.xyz/assets/imgs/default_discord_avatar.png`;
        return new Promise((res, _rej) => {
            let urlBase = (this.avatar != null && !publicOnly) ? `https://cdn.discordapp.com/users/${this.User.id}/users/${this.User.id}/avatars/${this.avatar}` : `https://cdn.discordapp.com/avatars/${this.User.id}/${this.User.avatar}`;
            urlExists(`${urlBase}.gif`, function (_err, exists) {
                res((exists) ? `${urlBase}.gif` : `${urlBase}.webp`);
            });
        });
    }
}