const {
    MessageEmbed
} = require(`discord.js`);

const {
    globalConfiguration,
    MainLog
} = require(`../../index`);
const timestring = require('timestring')
const moment = require('moment')
const utils = require(`../utils`);

module.exports = {
    name: "remindme",
    description: `Let me remind you of something later`,
    aliases: [],
    permission: `commands.remindme`,
    category: `tool`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `**Description:** ${this.description}`;
            if (this.aliases.length >= 1) description += `\n**Aliases:** \`${this.aliases.join('`, `')}\``;
            description += `\n**Cooldown:** None`;

            let fields = [];
            fields.push([`**Sub Commands:**`, `None yet`, false]);
            fields.push([`**Usage:**`, `${guild.configurationManager.configuration.prefix}${this.name} <time> [reason]`, false]);
            fields.push([`**Example:**`, `${guild.configurationManager.configuration.prefix}${this.name} 24h Tell <@933695613294501888> how much i love him`, false]);
            return utils.sendMain(message, guild, `Command: ${guild.configurationManager.configuration.prefix}${this.name}`, `${description}`, fields, true); /*Updated To New Utils*/
        }
        let reason = '';
        let time = 0;
        try {
            time = timestring(args[0])
            args[0] = "";
            reason = args.join(' ');
        } catch {
            reason = args.join(' ');
        }
        if (time == 0) return utils.sendError(message, guild, `Could not set reminder`, `No time specified`);
        if (reason == "" || reason.replaceAll(' ', '') == "") return utils.sendError(message, guild, `Could not set reminder`, `No content specified`);

        let remindDate = moment();
        if (typeof time == "number") remindDate.add(time, 'seconds');
        time = remindDate.format(`YYYY-MM-DD HH:mm-ss`);

        let result = await guild.setReminder(message.channel.guild.id, message.author.id, message.channel.id, time, {text:reason});
        if (result == false)return utils.sendError(message, guild, `Could not set reminder`, `An error occured`);
        return utils.sendSuccess(message, guild, `Reminder set !`, `I will remind you of that <t:${remindDate.unix()}>`, [], true); /*Updated To New Utils*/
    }
}