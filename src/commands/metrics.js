const moment = require("moment");

const utils = require(`../utils`);

module.exports = {
    name: "metrics",
    description: `Show the metrics stats.`,
    aliases: [],
    permission: `commands.metrics`,
    category: `administration`,
    async exec(client, message, args, guild = undefined, isSlashCommand = false) {
        let fields = [];
        let totalMetrics = [];
        let getTheMetrics = new Promise((res, rej) => {
            let tempStats = {
                "botStartup": [],
                "fromSentToEnd_Message": [],
                "fromSentToEnd_Command": [],
                "chatModeration": [],
                "permissionGrabbing": []
            }
            guild.moderationManager.sqlPool.query(`SELECT * FROM \`metrics\``, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}][${moment().diff(startTimer)}ms]`);
                    res(false);
                }
                if (results.length == 0) res(null);
                let control = results.length;
                totalMetrics = results.length;
                results.reverse();
                results.forEach(metric => {
                    metric = JSON.parse(metric.data).reduce((target, key, _index) => {
                        target[key.name] = key.timestamp;
                        return target;
                    }, {});
                    if (typeof metric.botReady != "undefined")tempStats.botStartup.push(moment(metric.botReady).diff(metric.initialization));
                    if (typeof metric.MessageCreation != "undefined"){
                        let total = moment(metric.end).diff(metric.initialization);
                        if (typeof metric.CommandHandlerStart != "undefined")tempStats.fromSentToEnd_Command.push(total);
                        if (typeof metric.CommandHandlerStart == "undefined")tempStats.fromSentToEnd_Message.push(total);
                        if (![typeof metric.GettingGlobalPermissions, typeof metric.GotPermissions].includes("undefined"))tempStats.permissionGrabbing.push(moment(metric.GotPermissions).diff(metric.GettingGlobalPermissions));
                        if (![typeof metric.ChatModerationStart, typeof metric.ChatViolationDone].includes("undefined"))tempStats.chatModeration.push(moment(metric.ChatViolationDone).diff(metric.ChatModerationStart));
                    }
                    control--;
                    if (control <= 0){
                        fields.push(["**Full Message Handle (Commands Only)**",(tempStats.fromSentToEnd_Command.length != 0) ? `${(ArrayAvg(tempStats.fromSentToEnd_Command)).toFixed(2)}ms` : `**No Data**`,true]);
                        fields.push(["**Full Message Handle (Without Commands)**",(tempStats.fromSentToEnd_Message.length != 0) ? `${(ArrayAvg(tempStats.fromSentToEnd_Message)).toFixed(2)}ms` : `**No Data**`,true]);
                        fields.push(["**Permission Grabbing**",(tempStats.permissionGrabbing.length != 0) ? `${(ArrayAvg(tempStats.permissionGrabbing)).toFixed(2)}ms` : `**No Data**`,true]);
                        fields.push(["**Bot Startup**",(tempStats.botStartup.length != 0) ? `${(ArrayAvg(tempStats.botStartup)/1000).toFixed(2)}s` : `**No Data**`,true]);
                        res(true);
                    }
                });
            });
        });
        await getTheMetrics;
        return utils.sendMain(message, guild, `Metrics`, `Bot metrics from what is stored in the database **[${totalMetrics} entries]**`, fields, true);
    }
}

function ArrayAvg(myArray) {
    var i = 0, summ = 0, ArrayLen = myArray.length;
    while (i < ArrayLen) {
        summ = summ + myArray[i++];
}
    return summ / ArrayLen;
}