/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing classes
const FileLogger = require('./FileLogger');
const ConfigurationManager = require('./ConfigurationManager');

module.exports = class PermissionManager extends ConfigurationManager {
    constructor() {
        super();

        this.permission = this.configuration;

        this.initialized = false;
    }
}