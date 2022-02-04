const mysql = require('mysql');

module.exports = class sqlLogger {
    constructor(logTable = "logs") {
        this.sqlConfiguration = require('../../MySQL.json');
        this.sqlTable = logTable;
    }

    async log(type = 'none', content, guildId = undefined, channelId = undefined, userId = undefined, messageId = undefined) {
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

        let connection = mysql.createConnection(this.sqlConfiguration);
        connection.connect();
        let requestPromise = new Promise((res, rej) => {
            connection.query(`INSERT INTO ${zisse.sqlTable} (\`${valueNames.join('`,`')}\`) VALUES (${valuesPlaceHolders.join(', ')})`, values, async function (error, results, fields) {
                connection.end();
                if (error) res(false);
            });
        });
        await requestPromise;
        return true;
    }
}