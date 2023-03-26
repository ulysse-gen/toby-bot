/////////////////////////////////
//SQLLogger is the main class for logs, main utility is to log in the console as well as a specified file
/////////////////////////////////

//Importing NodeJS Modules
import moment from 'moment';
import mysql from 'mysql';

//Importing Classes
import Logger from './Logger';
import FileLogger from './FileLogger';
import TobyBot from './TobyBot';

//Creating objects
const MainLog = new FileLogger();

export default class SQLLogger extends Logger {
    TobyBot: TobyBot;
    SQLPool: any;
    SQLTable: string;
    verbose: boolean;
    initialized: boolean;
    constructor(TobyBot: TobyBot, SQLTable: string) {
        super();

        this.TobyBot = TobyBot;
        
        this.SQLPool = TobyBot.SQLPool;
        this.SQLTable = SQLTable;

        this.verbose = false;
        this.initialized = false;
        this.initialize();
    }

    async initialize() {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing ${this.constructor.name} [${moment().diff(startTimer)}ms]`);
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
        return this.SQLPool.query(`INSERT INTO \`logs\` (type, context) VALUES (?,?)`, ['ClientLogin', JSON.stringify({version: TobyBot.PackageInformations.version, clientId: TobyBot.client.user.id})], async (error, results) => {
            return !(error);
        });
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