/////////////////////////////////
//MetricManager is the main class for metrics management.
/////////////////////////////////

//Importing classes
import { Collection } from 'discord.js';
import { UnknownError } from './Errors';
import Metric from './Metric';
import TobyBot from './TobyBot';

export default class MetricManager {
    metrics: Collection<string, Metric>;
    TobyBot: TobyBot;
    constructor(TobyBot: TobyBot) {
        this.TobyBot = TobyBot;
        this.metrics = new Collection<string, Metric>;
    }

    createMetric(name: string) {
        let newMetric = new Metric(name, this);
        this.metrics.set(newMetric.id, newMetric);
        return newMetric;
    }

    endMetric(id: string) {
        if (!this.metrics.has(id)) throw new UnknownError('Unknown metric.');
        let metricToEnd = this.metrics.get(id);
        metricToEnd.addEntry(`end`);
        return metricToEnd;
    }
}