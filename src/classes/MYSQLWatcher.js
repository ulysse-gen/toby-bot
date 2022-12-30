//Importing NodeJS Modules
const MySQLEvents = require('@rodrigogs/mysql-events')
const _ = require('lodash')

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = class API {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.EventWatcher = new MySQLEvents({"host": process.env.MARIADB_HOST,"user":'root',"password":process.env.MARIADB_ROOT_PASSWORD}, {
            startAtEnd: true,
          });

        this.verbose = false;
        this.initialize();
    }

    async initialize(){
        this.EventWatcher.addTrigger({
            name: 'guild_update',
            expression: `${process.env.MARIADB_DATABASE_NC}.guilds`,
            statement: MySQLEvents.STATEMENTS.UPDATE,
            onEvent: async (event) => {
                event.affectedRows.forEach(async affectedRow => {
                    if (this.verbose)MainLog.log(`The guild ${affectedRow.after.id} has been updated on SQL, loading and updating if necessary.`);
                    let Guild = await this.TobyBot.GuildManager.getGuildById(affectedRow.after.id);
                    if (Guild)Guild.loadSQLContent(true);
                });
            },
        });

        this.EventWatcher.addTrigger({
            name: 'user_update',
            expression: `${process.env.MARIADB_DATABASE_NC}.users`,
            statement: MySQLEvents.STATEMENTS.UPDATE,
            onEvent: async (event) => {
                event.affectedRows.forEach(async affectedRow => {
                    if (this.verbose)MainLog.log(`The user ${affectedRow.after.id} has been updated on SQL, loading and updating if necessary.`);
                    let User = await this.TobyBot.UserManager.getUserById(affectedRow.after.id);
                    if (User)User.loadSQLContent(true);
                });
            },
        });

        this.EventWatcher.addTrigger({
            name: 'tobybot_update',
            expression: `${process.env.MARIADB_DATABASE_NC}.tobybot`,
            statement: MySQLEvents.STATEMENTS.UPDATE,
            onEvent: async (event) => {
                event.affectedRows.forEach(async affectedRow => {
                    if (this.verbose)MainLog.log(`TobyBot has been updated on SQL, loading and updating if necessary.`);
                    this.TobyBot.loadSQLContent(true);
                });
            },
        });


        this.EventWatcher.start().catch(err => {
            ErrorLog.error('Could not start MySQL Watcther');
            console.log(err);
        });

        this.EventWatcher.on(MySQLEvents.EVENTS.CONNECTION_ERROR, this.ConnectionError);
        this.EventWatcher.on(MySQLEvents.EVENTS.ZONGJI_ERROR, this.ZongJiError);
        return true;
    }

    async ZongJiError(err) {
        if (err.code && err.code == 'ER_NO_BINARY_LOGGING'){
            ErrorLog.warning(`Binary logging is not enabled, MySQL Watching disabled. You might find your solution in there:`);
            ErrorLog.warning(`https://tobybot.xyz/help/MySQL_Watching_disabled`);
            return true;
        }
        console.log(err);
        return false;
    }

    async ConnectionError(err) {
        ErrorLog.error(`MySQL Watcher - SQL connection dropped.`)
        return true;
    }
}