const mysql = require('mysql');

const Logger = require(`../classes/Logger`);

const MainLog = new Logger();
const SQLLogger = new Logger(`./logs/sql.log`);

module.exports = class sqlExecutor {
    constructor() {
        this.sqlPool = mysql.createPool(require('../../MySQL.json'));
    }

    async query(query, cb = undefined) {
        if (typeof query != "string" || query == "")return false;
        
        let execution = await this.sqlPool.getConnection((err, connection) => {
            if (err) {
                SQLLogger.log(`An error occured trying to perform a query. [${err.toString()}]`);
                return null;
            }
            connection.query
        });




        this.sqlPool.getConnection((err, connection) => {
            if (err) {
                ErrorLog.log(`An error occured trying to get a connection from the pool. ${err.toString()}`);
                return false;
            }
            connection.query(`SELECT * FROM \`reminders\` WHERE \`status\`='active'`, async function (error, results, fields) {
                let control = results.length;
                if (typeof results != "undefined" && results != null && results.length != 0) results.forEach(async indReminer => {
                    if (moment(indReminer.timestamp).isBefore(moment())) {
                        await this.client.guilds.fetch(indReminer.guildId).then(async fetchedGuild => {
                            await fetchedGuild.members.fetch(indReminer.userId).then(async fetchedMember => {
                                await fetchedGuild.channels.fetch(indReminer.channelId).then(async fetchedChannel => {
                                    let reminderData = JSON.parse(indReminer.content)
                                    let embed = new MessageEmbed({
                                        title: `Reminder !`,
                                        color: (typeof this.globalGuilds.guilds[indReminer.guildId] != "undefined") ? this.globalGuilds.guilds[indReminer.guildId].configuration.colors.main : `#FFFFFF`,
                                        description: `${reminderData.text}`
                                    });
                                    embed.addField(`**Created**`, `<t:${moment(indReminer.createdTimestamp).unix()}>`, true);
                                    embed.addField(`**Set to**`, `<t:${moment(indReminer.timestamp).unix()}>`, true);
                                    connection.query(`UPDATE \`reminders\` SET \`status\`='expired' WHERE \`numId\`=${indReminer.numId}`, async function (error, results, fields) {});
                                    MainLog.log(`Reminded ${fetchedMember.user.tag}(${indReminer.userId}).`);
                                    fetchedChannel.send({
                                        content: `<@${fetchedMember.user.id}>`,
                                        embeds: [embed]
                                    }, false).catch(e => utils.messageReplyFailLogger(message, guild, e));
                                    return true;
                                }).catch(e => console.log(`sqlManager.js could not fetch channel ${this.globalGuilds.guilds[indReminer.guildId]} (${e.toString()})`));
                            }).catch(e => console.log(`sqlManager.js could not fetch member ${this.globalGuilds.guilds[indReminer.guildId]} (${e.toString()})`));
                        }).catch(e => console.log(`sqlManager.js could not fetch guild ${this.globalGuilds.guilds[indReminer.guildId]} (${e.toString()})`));
                    }
                    control++;
                    if (control <= 0) {
                        return true;
                    }
                });
                try {
                    connection.release()
                } catch (e) {}
                if (error) {
                    ErrorLog.log(`An error occured during the query. ${error.toString()}`);
                    return false;
                }
                return true;
            });
        });
    }
}