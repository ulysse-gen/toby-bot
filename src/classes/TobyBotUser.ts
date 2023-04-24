/////////////////////////////////
//User is the main class for Users
/////////////////////////////////

import { User as DiscordUser } from "discord.js";
import { SQLError } from "./Errors";

//Importing classes
import SQLConfigurationManager from "./SQLConfigurationManager";
import TobyBot from "./TobyBot";

export default class TobyBotUser {
    TobyBot: TobyBot;
    User: DiscordUser;
    initialized: boolean;
    ConfigurationManager: SQLConfigurationManager;
    permissionLevel: number;
    numId: number;
    password: string;
    constructor(TobyBot: TobyBot, user: DiscordUser) {
        this.TobyBot = TobyBot;
        this.User = user;

        this.initialized = false;
    }

    apiVersion (){
        if (!this.initialized)return undefined;
        let apiVersion = {
            id: this.User.id,
            user: this.User,
            configuration: this.ConfigurationManager.configuration,
            permissionLevel: this.permissionLevel
        };
        return apiVersion;
    }

    tokenVersion () {
        if (!this.initialized)return undefined;
        let tokenVersion = {
            id: this.User.id,
            permissionLevel: this.permissionLevel
        };
        return tokenVersion;
    }

    async initialize(createIfNonExistant = false): Promise<TobyBotUser> {
        this.ConfigurationManager = new SQLConfigurationManager('users', `\`id\` = '${this.User.id}'`, undefined, require('/app/configurations/defaults/UserConfiguration.json'));
        await this.ConfigurationManager.initialize(createIfNonExistant, this);
        await this.loadSQLContent();
        this.initialized = true;
        return this;
    }

    async loadSQLContent(checkForUpdate = false) {
        return new Promise((res, _rej) => {
            this.TobyBot.SQLPool.query(`SELECT * FROM \`users\` WHERE id='${this.User.id}'`, (error, results) => {
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
            this.TobyBot.SQLPool.query(`SELECT * FROM \`users\` WHERE id='${this.User.id}'`, (error, results) => {
                if (error)throw new SQLError('Could not select user from the database.', {cause: error});
                if (results.length == 0){
                    this.TobyBot.SQLPool.query(`INSERT INTO \`users\` (id, configuration) VALUES (?,?)`, [this.User.id, JSON.stringify(require('/app/configurations/defaults/UserConfiguration.json'))], async (error, results) => {
                        if (error)throw new SQLError('Could not insert user in the database.', {cause: error});
                        if (results.affectedRows != 1) throw new SQLError('Could not insert user in the database.');
                        res(true);
                    });
                }else {
                    res(true);
                }
            });
        });
    }

    async getPfp() {
        if (typeof this.User.avatar == "undefined") return `https://tobybot.xyz/assets/imgs/default_discord_avatar.png`;
        return this.User.avatarURL();
    }
}