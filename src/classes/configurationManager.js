/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = class ConfigurationManager {
    constructor() {
        this.configuration = {};

        this.initialized = false;
        this.currentlySaving = false;

        this.verbose = true;

        this.initialize();
    }

    async initialize() {
        var zisse = this;
        var startTimer = moment();
        if (zisse.verbose)MainLog.log(`Initializing ConfigurationManager [${moment().diff(startTimer)}ms]`);
        if (zisse.verbose)MainLog.log(`Initialized ConfigurationManager [${moment().diff(startTimer)}ms]`);
        this.initialized = true;
        return true;
    }
}