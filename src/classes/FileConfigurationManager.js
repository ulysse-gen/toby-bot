/////////////////////////////////
//ConfigurationManager is the main class for configurations. Configurations include file config & MySQL configs. Using the Extended classes
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');

//Importing classes
const FileLogger = require('./FileLogger');
const ConfigurationManager = require('./ConfigurationManager');

//Creating objects
const MainLog = new FileLogger();

module.exports = class FileConfigurationManager extends ConfigurationManager {
    constructor(configurationFile = `./configurations/configuration.json`) {
        super();

        this.file = (configurationFile.startsWith('./')) ? `${process.cwd()}/${configurationFile.replace('./', '')}` : `${process.cwd()}/configurations/${configurationFile}`;
    }

    async initialize() {
        var zisse = this;
        var startTimer = moment();
        if (zisse.verbose)MainLog.log(`Initializing ConfigurationManager [${moment().diff(startTimer)}ms]`);
        if (!fs.existsSync(`${process.cwd()}/configurations`)) fs.mkdirSync(`${process.cwd()}/configurations`);
        if (!fs.existsSync(this.file)) fs.appendFile(this.file, JSON.stringify(this.configuration, null, 2), function (err) {
            if (err) throw err;
        });



        if (zisse.verbose)MainLog.log(`Initialized ConfigurationManager [${moment().diff(startTimer)}ms]`);
        this.initialized = true;
        return true;
    }
}