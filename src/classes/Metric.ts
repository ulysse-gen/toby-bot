/////////////////////////////////
//Metric is the main class for metric.
/////////////////////////////////

//Importing NodeJS modules
import moment from 'moment';
import crypto from 'crypto';
import _ from 'lodash';

//Importing classes
import FileLogger from './FileLogger';
import MetricManager from './MetricManager';

export default class Metric {
    metricManager: MetricManager;
    name: string;
    id: string;
    entries: { name: string; timestamp: moment.Moment; extras: {}; }[];
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