/////////////////////////////////
//MetricManager is the main class for metrics management.
/////////////////////////////////

//Importing classes
const Metric = require('./Metric');

module.exports = class MetricManager {
    constructor() {
        this.metrics = {};
    }

    createMetric(name) {
        let newMetric = new Metric(name, this);
        this.metrics[newMetric.id] = newMetric;
        return this.metrics[newMetric.id];
    }

    endMetric(id) {
        if (typeof this.metrics[id] == "undefined") throw new Error('Unknown metric.');
        let metricToEnd = this.metrics[id];
        metricToEnd.addEntry(`end`);
        return metricToEnd;
    }
}