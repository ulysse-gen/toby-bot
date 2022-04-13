const moment = require('moment');
const crypto = require('crypto');

const Logger = require(`./Logger`);
const ErrorLog = new Logger(`./logs/error.log`);

const MainLog = new Logger();

module.exports = class Metric {
    constructor(name, metricManager) {
        this.metricManager = metricManager;
        this.name = name;
        this.id = crypto.randomBytes(25).toString('hex');
        this.entries = [{
            name: "initialization",
            timestamp: moment(),
            extras: {}
        }];
    }

    async addEntry(name, extras = {}) {
        this.entries.push({
            name: name,
            timestamp: moment(),
            extras: extras
        });
        return true;
    }

    end() {
        return this.metricManager.endMetric(this.id);
    }
}