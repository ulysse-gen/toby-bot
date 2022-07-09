/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');
const fs = require('fs');
const _ = require('lodash');

//Importing classes
const FileLogger = require('./FileLogger');
const ConfigurationManager = require('./ConfigurationManager');

//Creating objects
const MainLog = new FileLogger();

module.exports = class FileConfigurationManager extends ConfigurationManager {
    constructor(configurationFile, defaultConfiguration = {}) {
        super();

        this.file = `/data/configs/${configurationFile}`;
        this.defaultConfiguration = defaultConfiguration;

        this.initialized = false;
    }

    async initialize(createIfNonExistant = false) {
        var startTimer = moment();
        if (this.verbose)MainLog.log(`Initializing ${this.constructor.name} [${moment().diff(startTimer)}ms]`);
        if (!fs.existsSync(this.file) && !createIfNonExistant) throw new Error('File not found.');
        await this.createPath(this.file);
        if (!fs.existsSync(this.file)) {
            fs.appendFileSync(this.file, JSON.stringify(this.defaultConfiguration, null, 2));
            await this.load();
        } else {
            await this.load();
        }
        let integrityCheck = await this.mergeRecursive(this.configuration, this.defaultConfiguration);
        if (integrityCheck.updated){
            this.configuration = integrityCheck.result;
            await this.save();
        }
        if (this.verbose)MainLog.log(`Initialized ${this.constructor.name} [${moment().diff(startTimer)}ms]`);
        this.initialized = true;
        return true;
    }

    async set(path, value) {
        _.set(this.configuration, path, value);
        return this.save();
    }

    async delete(path) {
        _.unset(this.configuration, path);
        return this.save();
    }

    async load() {
        delete require.cache[require.resolve(this.file)];
        this.configuration = require(this.file);
        return true;
    }

    async save() {
        let startTimer = moment();
        if (this.verbose) MainLog.log(`Saving configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
        await this.createPath(this.file);
        fs.appendFile(this.file, JSON.stringify(this.configuration, null, 2), function (err) {
            if (err) throw err;
        });
        if (this.verbose) MainLog.log(`Configuration saved configuration. [${this.SQLTable} => ${this.SQLWhere}][${moment().diff(startTimer)}ms]`);
        return true;
    }

    async createPath(path) {
        let pathParts = path.replace('/data/', '').split('/').filter(v => v != "").slice(0,-1);
        let currentPath = '/data';
        if (pathParts.length == 0)return true;
        return new Promise((res, rej) => {
            while (pathParts.length > 0){
                currentPath += `/${pathParts.shift()}`;
                if (!fs.existsSync(currentPath)) fs.mkdirSync(currentPath);
                if (pathParts.length <= 0)res(true);
            } 
        });
    }

    async mergeRecursive(obj1, obj2, embeded = undefined) {
        var _this = this;
        var startTimer = moment();
        if (this.verbose && typeof embeded == "undefined")MainLog.log(`[RecursiveMerger] Starting recursive merging [${moment().diff(startTimer)}ms]`);
        for (var p in obj2) {
            if (obj2[p].constructor == Object){
                obj1[p] = await _this.mergeRecursive(obj1[p], obj2[p], startTimer);
            } else {
                switch (typeof obj1[p]) {
                    case typeof obj2[p]:
                        break;

                    case "undefined":
                        if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] is an not defined, creating it with value [${obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                        obj1[p] = obj2[p];
                        break;
                
                    default:
                        if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] has the wrong type, switching from [${typeof obj1[p]}] to [${typeof obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                        obj1[p] = obj2[p];
                        break;
                }
            }
        }
        return obj1;
    }
}