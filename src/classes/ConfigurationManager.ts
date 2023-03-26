/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
import _ from 'lodash';
import moment from 'moment';

//Importing classes
import FileLogger from './FileLogger';
let EventEmitter = require('events').EventEmitter

//Creating objects
const MainLog = new FileLogger();

export default class ConfigurationManager extends EventEmitter {
    constructor() {
        super();
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

    set(path, value): Boolean | Promise<Boolean> {
        return _.set(this.configuration, path, value);
    }

    get(path): any | Promise<any> {
        return _.get(this.configuration, path);
    }

    delete(path): Boolean | Promise<Boolean> {
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