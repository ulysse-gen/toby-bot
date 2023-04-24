import linkify from 'linkifyjs';
import url from 'url';
import AutoModerationViolation from './AutoModerationViolation';
import { DMChannel, Message, MessageEmbed, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User } from "discord.js";
import moment from 'moment';
import removeAccents from `remove-accents`;
import AutoModeration from './AutoModeration';
import TobyBot from './TobyBot';
import { TobyBotMessage } from '../interfaces/main';
import Guild from './Guild';
const leetSpeakConverter = require("/app/src/utils/leet-converter");


export default class AutoModerationRun {
    TobyBot: TobyBot;
    AutoModeration: AutoModeration;
    message: TobyBotMessage;
    User: User;
    Channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel;
    Guild: Guild;
    violations: AutoModerationViolation[];
    startTimer: moment.Moment;
    linkify: any;
    violationsProcessed: any;
    constructor(AutoModeration: AutoModeration, message) {
        this.TobyBot = AutoModeration.TobyBot;
        this.AutoModeration = AutoModeration;
        this.message = message;
        
        this.User = this.message.author;
        this.Channel = this.message.channel;
        this.Guild = this.message.TobyBot.Guild;

        this.violations = [];
    }

    async run() {
        this.startTimer = moment();
        console.log(`AutoModeration Scan started [0ms]`)

        this.User = await this.message.TobyBot.Guild.Guild.members.fetch(this.User);
        //if (this.AutoModeration.hasPermission(this, `automod.*`))return true;
        if (!this.Guild.ConfigurationManager.get("autoModeration.status"))return true;

        this.linkify = linkify.find(this.message.content);

        if (this.Guild.ConfigurationManager.get("autoModeration.modules.scam.status"))await this.scam();

        await this.makeViolationPunishments();
        await this.logViolations()

        return true;
    }

    async scam() {
        console.log(`Checking for scams [${moment().diff(this.startTimer)}ms]`);
        if (this.Guild.ConfigurationManager.get("autoModeration.modules.scam.links"))await this.scamLink();
        if (this.Guild.ConfigurationManager.get("autoModeration.modules.scam.terms"))await this.scamTerms();
        if (this.Guild.ConfigurationManager.get("autoModeration.modules.scam.slashes"))await this.scamSlashes();
    }

    async scamLink() {
        console.log(`Checking for scam links [${moment().diff(this.startTimer)}ms]`);
        if (this.linkify.length == 0)return;
        for (var link of this.linkify){
            link = {
                fullLink: link.href
            }
            link.url = url.parse(link.fullLink);
            link.fullHost = link.url.host;
            link.mainDomain = `${link.url.host.split(".")[link.url.host.split(".").length-2]}.${link.url.host.split(".")[link.url.host.split(".").length-1]}`;

            if (this.AutoModeration.scamLinks)
                if (this.AutoModeration.scamLinks.includes(link.mainDomain) || this.AutoModeration.scamLinks.includes(`*.${link.mainDomain}`) || this.AutoModeration.scamLinks.includes(link.fullHost))this.violations.push(new AutoModerationViolation(this, "Scam Links", "Scam Links", link.fullHost, this.Guild.ConfigurationManager.get("autoModeration.modules.scam.punishment")).setWeight(100))
        }
        return true;
    }
    async scamTerms() {
        console.log(`Checking for scam terms [${moment().diff(this.startTimer)}ms]`);
        this.AutoModeration.scamTerms.forEach(entry => {
            if (this.textContains(this.message.content, entry))this.violations.push(new AutoModerationViolation(this, "Scam Terms", "Scam Terms", entry, this.Guild.ConfigurationManager.get("autoModeration.modules.scam.punishment")).setWeight(90))
        });
        return true;
    }
    async scamSlashes() {
        console.log(`Checking for scam slashes [${moment().diff(this.startTimer)}ms]`);

        this.AutoModeration.scamSlashes.forEach(entry => {
            if (this.textContains(this.message.content, entry))this.violations.push(new AutoModerationViolation(this, "Scam Slashes", "Scam Slashes", entry, this.Guild.ConfigurationManager.get("autoModeration.modules.scam.punishment")).setWeight(90))
        });
        return true;
    }

    async makeViolationPunishments() {
        if (this.violations.length == 0)return true;

        this.violationsProcessed = this.violations.reduce((prev, current) => {
            if (typeof prev[current.checkName] == "undefined")prev[current.checkName] = {
                triggers: [],
                Punishment: current.Punishment
            }
            prev[current.checkName].triggers.push(current.TriggerValue);
            return prev;
        }, {});

        console.log(this.violationsProcessed);
        
        return true;
    }

    async logViolations() {
        if (this.violations.length == 0)return true;
        if (await this.AutoModeration.TobyBot.ConfigurationManager.get('logging.autoModerationLogs.inConsole')){
            console.log('Received message with ' + this.violations.length + ` violations [${Object.keys(this.violationsProcessed).length}] [${moment().diff(this.startTimer)}ms]`);
        }

        if (await this.AutoModeration.TobyBot.ConfigurationManager.get('logging.autoModerationLogs.inChannel') && typeof this.AutoModeration.TobyBot.loggers.autoModerationLogs != "undefined"){
            let embed = new MessageEmbed().setTitle(this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.title')).setDescription(this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.description', {violations: Object.keys(this.violationsProcessed).map(e => {
                return `**${e}**: ${this.violationsProcessed[e].triggers.length} violations.`;
            }).join('\n')})).setColor(this.Guild.ConfigurationManager.get('style.colors.main')).setAuthor({name: this.User.user.tag, iconURL: await this.Guild.getUserPfp(this.User)});
            embed.addField(this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.user.title'), this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.user.description', {userId: this.User.id}), true);
            embed.addField(this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.channel.title'), this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.channel.description', {channelId: this.Channel.id}), true);
            embed.addField(this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.guild.title'), this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.guild.description', {guildId: this.Guild.Guild.id}), true);
            embed.addField(this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.violationsCount.title'), this.AutoModeration.TobyBot.i18n.__('channelLogging.autoModerationLogs.field.violationsCount.description', {count: this.violations.length}), true);
            this.AutoModeration.TobyBot.loggers.autoModerationLogs.logRaw({embeds: [embed]});
        }
        
        if (await this.Guild.ConfigurationManager.get('logging.autoModerationLogs.inChannel') && typeof this.Guild.loggers.autoModerationLogs != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.autoModerationLogs.title')).setDescription(this.Guild.i18n.__('channelLogging.autoModerationLogs.description', {violations: Object.keys(this.violationsProcessed).map(e => {
                return `**${e}**: ${this.violationsProcessed[e].triggers.length} violations.`;
            }).join('\n')})).setColor(this.Guild.ConfigurationManager.get('style.colors.main')).setAuthor({name: this.User.user.tag, iconURL: await this.Guild.getUserPfp(this.User)});
            embed.addField(this.Guild.i18n.__('channelLogging.autoModerationLogs.field.user.title'), this.Guild.i18n.__('channelLogging.autoModerationLogs.field.user.description', {userId: this.User.id}), true);
            embed.addField(this.Guild.i18n.__('channelLogging.autoModerationLogs.field.channel.title'), this.Guild.i18n.__('channelLogging.autoModerationLogs.field.channel.description', {channelId: this.Channel.id}), true);
            embed.addField(this.Guild.i18n.__('channelLogging.autoModerationLogs.field.violationsCount.title'), this.Guild.i18n.__('channelLogging.autoModerationLogs.field.violationsCount.description', {count: this.violations.length}), true);
            this.Guild.loggers.autoModerationLogs.logRaw({embeds: [embed]});
        }
                
        return true;
    }

    textContains (text, word) {
        let messageText = text.toLowerCase();
        let splitters = [" ", ",", ".", ";", ":", "/", "\\", "-", "_", "+", "*", "="];
        let toTry = [word.toLowerCase(), word.replaceAll(' ', '')];
        let found = false;
        splitters.forEach(splitter => {
            let toAdd = word.split('').join(splitter);
            if (!toTry.includes(toAdd)) toTry.push(toAdd);
            toAdd = word.split('').join(splitter + splitter);
            if (!toTry.includes(toAdd)) toTry.push(toAdd);
            toAdd = word.split('').join(splitter + splitter + splitter);
            if (!toTry.includes(toAdd)) toTry.push(toAdd);
        });
        toTry.forEach(element => {
            let withoutAccents = removeAccents(element);
            if (!toTry.includes(withoutAccents)) toTry.push(withoutAccents);
        });
        toTry.forEach(possibility => {
            if ((new RegExp(this.escapeRegex(possibility))).test(messageText) || (new RegExp(this.escapeRegex(possibility))).test(leetSpeakConverter.convertInputReverse(messageText))) {
                found = true;
                return found;
            }
        });
        return found;
    }

    escapeRegex(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}