/////////////////////////////////
//SQLLogger is the main class for logs, main utility is to log in the console as well as a specified file
/////////////////////////////////

//Importing NodeJS Modules
const moment = require('moment');
const mysql = require(`mysql`);

//Importing Classes
const Logger = require('./Logger');
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = class SQLLogger extends Logger {
    constructor(SQLConnectionInfos, SQLTable) {
        super();
        
        this.SQLPool = undefined;
        this.SQLConnectionInfos = SQLConnectionInfos;
        this.SQLTable = SQLTable;

        this.verbose = false;
        this.initialized = false;
        this.initialize();
    }

    async initialize() {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing ${this.constructor.name} [${moment().diff(startTimer)}ms]`);

        if (typeof this.SQLConnectionInfos != "object") throw new Error('Wrong type given for SQLConnectionInfos.');
        if (typeof this.SQLConnectionInfos.host != "string") throw new Error('Wrong type given for SQLConnectionInfos.host.');
        if (typeof this.SQLConnectionInfos.user != "string") throw new Error('Wrong type given for SQLConnectionInfos.user.');
        if (typeof this.SQLConnectionInfos.password != "string") throw new Error('Wrong type given for SQLConnectionInfos.password.');
        if (typeof this.SQLConnectionInfos.database != "string") throw new Error('Wrong type given for SQLConnectionInfos.database.');
        if (typeof this.SQLConnectionInfos.charset != "string") throw new Error('Wrong type given for SQLConnectionInfos.charset.');
        if (typeof this.SQLConnectionInfos.connectionLimit != "number") throw new Error('Wrong type given for SQLConnectionInfos.connectionLimit.');

        this.SQLPool = mysql.createPool(this.SQLConnectionInfos)

        if (this.verbose)MainLog.log(`Initialized ${this.constructor.name} [${moment().diff(startTimer)}ms]`);
        this.initialized = true;
        return true;
    }

    async logCommandExecution(CommandExecution, specificity = undefined){
        if (!this.initialized)return false;
        this.SQLPool.query(`INSERT INTO \`logs\` (type, context, content) VALUES (?,?,?)`, ['CommandExecution', await CommandExecution.makeSQLLog('context', specificity), await CommandExecution.makeSQLLog('content', specificity)], async (error, results) => {
            return !(error);
        });
        return false;
    }

    async logModerationAction(punishedId, punisherId, type, reason, length, historyLog){
        if (!this.initialized)return false;
        this.SQLPool.query(`INSERT INTO \`logs\` (type, context, content) VALUES (?,?,?)`, ['ModerationAction', JSON.stringify({punishedId: punishedId, punisherId: punisherId}), JSON.stringify({type: type, reason: reason, length: length, logs: JSON.parse(historyLog)})], async (error, results) => {
            return !(error);
        });
        return false;
    }

    async logReadyState(TobyBot){
        if (!this.initialized)return false;
        this.SQLPool.query(`INSERT INTO \`logs\` (type, context) VALUES (?,?)`, ['ClientLogin', JSON.stringify({version: TobyBot.PackageInformations.version, clientId: TobyBot.client.user.id})], async (error, results) => {
            return !(error);
        });
        return false;
    }

    async logShutdown(GlobalBot, reason, exit) {
        if (!this.initialized)return false;
        let version = (typeof GlobalBot.PackageInformations.version != "undefined") ? GlobalBot.PackageInformations.version : 'Not fetchable';
        let clientId = (typeof GlobalBot.client != "undefined" && (typeof GlobalBot.client.user != "undefined" && GlobalBot.client.user != null) && typeof GlobalBot.client.user.id != "undefined") ? GlobalBot.client.user.id : 'Not fetchable';
        let uptime = (typeof GlobalBot.client != "undefined" && typeof GlobalBot.client.uptime != "undefined") ? GlobalBot.client.uptime : 'Not fetchable';
        let lifeMetric = (typeof GlobalBot.LifeMetric != "undefined" && typeof GlobalBot.LifeMetric.exportLoggable != "undefined") ? GlobalBot.LifeMetric.exportLoggable() : 'Not fetchable';
        
        return new Promise((res, rej) => {
            this.SQLPool.query(`INSERT INTO \`logs\` (type, context, content) VALUES (?,?,?)`, ['BotShutdown', JSON.stringify({version: version, clientId: clientId}), JSON.stringify({reason: reason, exit: exit, uptime: uptime, lifeMetric: lifeMetric})], async (error, results) => {
                res(!(error));
            });
        });
    }
}