const mysql = require('mysql');

const Logger = require(`./Logger`);
//Loggers
const MainLog = new Logger();
const ErrorLog = new Logger(`./logs/error.log`);
module.exports = class sqlLogger {
    constructor(logTable = "logs") {
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
        this.sqlTable = logTable;
    }

    async log(type = 'none', content, guildId = undefined, channelId = undefined, userId = undefined, messageId = undefined, stats = undefined) {
        let zisse = this;
        if (typeof type != "string") return false;
        if (typeof content != "string") return false;
        if (type == "") type = "none";

        let values = [type, content];
        let valueNames = ["type", "content"];
        let valuesPlaceHolders = ["?", "?"];
        if (typeof guildId != "undefined") {
            values.push(guildId);
            valueNames.push("guildId");
            valuesPlaceHolders.push("?");
        }
        if (typeof channelId != "undefined") {
            values.push(channelId);
            valueNames.push("channelId");
            valuesPlaceHolders.push("?");
        }
        if (typeof userId != "undefined") {
            values.push(userId);
            valueNames.push("userId");
            valuesPlaceHolders.push("?");
        }
        if (typeof messageId != "undefined") {
            values.push(messageId);
            valueNames.push("messageId");
            valuesPlaceHolders.push("?");
        }
        if (typeof stats != "undefined") {
            values.push(JSON.stringify(stats));
            valueNames.push("stats");
            valuesPlaceHolders.push("?");
        }
        await new Promise((res, rej) => {
            zisse.sqlPool.getConnection((err, connection) => {
                if (err) {
                    ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                    res(false);
                }
                connection.query(`INSERT INTO ${zisse.sqlTable} (\`${valueNames.join('`,`')}\`) VALUES (${valuesPlaceHolders.join(', ')})`, values, async function (error, results, fields) {
                    if (results.affectedRows != 1) ErrorLog.log(`Did not insert for some reason wth. ${error.toString()}`);
                    try { connection.release() } catch (e) {}
                    if (error) {
                        ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                        res(false);
                    }
                    res(true);
                });
            });
        });
        return true;
    }
}