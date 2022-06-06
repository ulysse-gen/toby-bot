/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const _ = require('lodash');
const moment = require('moment');

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = class ConfigurationManager {
    constructor() {
        this._configuration = {};

        this.initialized = true;
        this.currentlySaving = false;

        this.verbose = false;
    }

    get configuration() {
        return this._configuration;
    }

    set configuration(value) {
        this._configuration = value;
    }

    async initialize() {
        return true;
    }

    set(path, value) {
        return _.set(this.configuration, path, value);
    }

    get(path) {
        return _.get(this.configuration, path);
    }

    delete(path) {
        return _.unset(this.configuration, path);
    }

    async mergeRecursive(obj1, obj2, embeded = undefined) {
        var _this = this;
        var startTimer = moment();
        var updated = [];
        if (this.verbose && typeof embeded == "undefined")MainLog.log(`[RecursiveMerger] Starting recursive merging [${moment().diff(startTimer)}ms]`);
        for (var p in obj2) {
            try {
                if (obj2[p].constructor == Object){
                    let mergeRecursiveEmbeded = await _this.mergeRecursive(obj1[p], obj2[p], startTimer);
                    if (mergeRecursiveEmbeded.updated) updated.push(true);
                    obj1[p] = mergeRecursiveEmbeded.result;
                } else {
                    switch (typeof obj1[p]) {
                        case typeof obj2[p]:
                            break;

                        case "undefined":
                            if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] is an not defined, creating it with value [${obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                            obj1[p] = obj2[p];
                            updated.push(true);
                            break;
                    
                        default:
                            if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] has the wrong type, switching from [${typeof obj1[p]}] to [${typeof obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                            obj1[p] = obj2[p];
                            updated.push(true);
                            break;
                    }
                }
            } catch (e) {
                if (_this.verbose)MainLog.log(`[RecursiveMerger] [${p}] is missing, creating it with value [${obj2[p]}] [${moment().diff((typeof embeded == "undefined") ? startTimer : embeded)}ms]`);
                obj1[p] = obj2[p];
                updated.push(true);
            }
        }
        return { result: obj1, updated: updated.includes(true) };
    }
}