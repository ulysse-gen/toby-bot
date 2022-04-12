const moment = require('moment');
const mysql = require('mysql');

const Logger = require(`./Logger`);
const Metric = require(`./Metric`);

const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);

module.exports = class metricsManager {
    constructor() {
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
        this.entries = {};
    }

    createMetric(name) {
        let createdMetric = new Metric(name, this);
        this.entries[createdMetric.id] = createdMetric;
        return createdMetric;
    }

    async endMetric(id) {
        let zisse = this;
        if (typeof this.entries[id] == "undefined")return null;
        let metricToEnd = this.entries[id];
        metricToEnd.addEntry(`end`);
        return new Promise((res, _rej) => {
            zisse.sqlPool.query(`INSERT INTO metrics (id,name,type,data) VALUES (?,?,?,?)`, [id, metricToEnd.name, `metric`, JSON.stringify(metricToEnd.entries)], async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(null);
                }
                if (results.affectedRows != 1) {
                    ErrorLog.log(`Could not create the metric. ${error.toString()}`);
                    res(false);
                }
                delete zisse.entries[id]
                res(true);
            });
        });
    }
}