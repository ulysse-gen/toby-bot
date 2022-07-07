/////////////////////////////////
//Metric is the main class for metric.
/////////////////////////////////

//Importing NodeJS modules
const moment = require('moment');
const crypto = require('crypto');
const _ = require('lodash');

//Importing classes
const FileLogger = require('./FileLogger');

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

    exportLoggable () {
        return _.omit(this, ['metricManager']);
    }

    async addEntry(name, extras = {}) {
        this.entries.push({
            name: name,
            timestamp: moment(),
            extras: extras
        });
        return this;
    }

    async end() {
        return this.metricManager.endMetric(this.id);
    }
}