/////////////////////////////////
//ModerationManager is the main class to handle moderation
/////////////////////////////////


//Importing NodeJS modules
import moment from 'moment';
import { GuildMember, MessageEmbed } from 'discord.js';

//Importing classes
import FileLogger from './FileLogger';
import { SQLError } from './Errors';
import TobyBot from './TobyBot';
import Guild from './Guild';
import { Punishment } from '../interfaces/main';
import CommandExecution from './CommandExecution';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');


export default class ModerationManager {
    TobyBot: TobyBot;
    Guild: Guild;
    verbose: boolean;
    constructor(Guild = undefined) {
        this.TobyBot = Guild.TobyBot;
        this.Guild = Guild;

        this.verbose = false;
    }

    async log(PunishedId, PunisherId, type, reason, length = false): Promise<string> {
        let _this = this;
        if (typeof PunishedId != "string" || typeof PunisherId != "string" || typeof type != "string" || typeof reason != "string") return undefined;

        let expireDate = (typeof length == "number") ? moment().add(length, 'seconds').format(`YYYY-MM-DD HH:mm-ss`) : moment().format(`YYYY-MM-DD HH:mm-ss`);

        let historyLog = JSON.stringify(await this.Guild.MessageManager.getLastMessagesByUser(PunishedId));

        let values = [type, (typeof length == "number") ? `active` : (typeof length == "boolean") ? (length == false) ? "info" : "indefinite" : "indefinite", this.Guild.Guild.id, PunishedId, PunisherId, reason, historyLog, expireDate];
        let valueNames = ["type", "status", "guildId", "userId", "moderatorId", "reason", "logs", "expires"];

        if (await this.Guild.GuildManager.TobyBot.ConfigurationManager.get('logging.commandExecution.inSQL'))await this.Guild.GuildManager.TobyBot.SQLLogger.logModerationAction(PunishedId, PunisherId, type, reason, length, historyLog);

        return new Promise((res, rej) => {
            _this.Guild.SQLPool.query(`INSERT INTO \`moderation\` (\`${valueNames.join('`,`')}\`) VALUES (?,?,?,?,?,?,?,?)`, values, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(undefined);
                }
                if (results.affectedRows != 1) {
                    ErrorLog.log(`Could not insert punishment.`);
                    res(undefined);
                }
                if (type == "Mute" || type == "Ban" || type == "Sticky") _this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='overwritten' WHERE \`userId\`='${PunishedId}' AND \`guildId\`='${this.Guild.Guild.id}' AND \`type\`='${type}' AND (\`status\`='active' OR \`status\`='indefinite' OR \`status\`='info') AND NOT \`numId\`='${results.insertId}'`);
                res(results.insertId);
            });
        });
    }

    async sendPunishEmbed(CommandExecution: CommandExecution, CaseId, Punished, Punisher, type, reason, length = false, silent = false): Promise<boolean> {
        let expireDate = (typeof length == "number") ? moment().add(length, 'seconds') : moment();

        let PunishedPfp = await this.Guild.getUserPfp(Punished);

        let embed = new MessageEmbed({
            color: this.Guild.ConfigurationManager.get("style.colors.main"),
            author: {
                name: Punished.user.tag,
                iconURL: `${PunishedPfp}?size=64`
            }
        });
        embed.addField(`**Case**`, `#${CaseId}`, true);
        embed.addField(`**Type**`, `${type}`, true);
        embed.addField(`**User**`, `<@${Punished.user.id}>`, true);
        embed.addField(`**Moderator**`, `<@${Punisher.user.id}>`, true);
        embed.addField(`**Reason**`, `${(typeof reason == "string") ? reason : `No reason specified.`}`, true);
        if (typeof length != "boolean") embed.addField(`**Expires**`, (typeof length == "number") ? `<t:${expireDate.unix()}>(<t:${expireDate.unix()}:R>)` : (typeof length == "boolean" && !length) ? `N/A` : `Indefinite`, true);
        embed.addField(`**Infos**`, `UserID: ${Punished.user.id} • <t:${moment().unix()}>`, false);

        let sendOption = {ephemeral: false, embeds: [embed]} as {ephemeral: boolean, embeds: Array<any>, slashOnly: boolean | undefined};
        if (silent){
            sendOption.slashOnly = true;
            sendOption.ephemeral = true;
        }

        CommandExecution.sendRaw(sendOption);

        if (this.Guild.ConfigurationManager.get("logging.moderationLogs.inChannel") && typeof this.Guild.loggers.moderationLogs != "undefined")
            this.Guild.loggers.moderationLogs.logRaw({embeds: [embed]});
        if (CommandExecution.TobyBot.ConfigurationManager.get("logging.moderationLogs.inChannel") && typeof CommandExecution.TobyBot.loggers.moderationLogs != "undefined")
            CommandExecution.TobyBot.loggers.moderationLogs.logRaw({embeds: [embed]});
        return true;
    }

    async sendUserPunishment(CommandExecution: CommandExecution, CaseId, PunishedId, PunisherId, type, reason, length = false): Promise<boolean> {
        let expireDate = (typeof length == "number") ? moment().add(length, 'seconds').format(`YYYY-MM-DD HH:mm-ss`) : moment().format(`YYYY-MM-DD HH:mm-ss`);

        let Punished = await this.Guild.getMemberById(PunishedId);
        let PunishedPfp = await this.Guild.getUserPfp(Punished);

        let embed = new MessageEmbed({
            color: this.Guild.ConfigurationManager.get("style.colors.error"),
            description: this.Guild.i18n.__(`moderation.dmAlert.${type}`, {guildName: this.Guild.Guild.name}),
            author: {
                name: Punished.user.tag,
                iconURL: `${PunishedPfp}?size=64`
            }
        });
        embed.addField(`**Reason**`, `${(typeof reason == "string") ? reason : `No reason specified.`}`, true);
        if (typeof length != "boolean") embed.addField(`**Expires**`, (typeof length == "number") ? `<t:${moment(expireDate).unix()}>(<t:${moment(expireDate).unix()}:R>)` : (typeof length == "boolean" && !length) ? `N/A` : `Indefinite`, true);

        return Punished.send({embeds: [embed]}).then(()=>true).catch(e => false);
    }

    async noteUser(CommandExecution: CommandExecution, Punished, PunishReason, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));
        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Note`, PunishReason);
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Note`, PunishReason, undefined, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.note`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        return true;
    }

    async stickyUser(CommandExecution: CommandExecution, Punished, PunishReason, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));
        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Sticky`, PunishReason);
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Sticky`, PunishReason, undefined, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.sticky`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        return true;
    }

    async warnUser(CommandExecution: CommandExecution, Punished, PunishReason, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));
        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Warn`, PunishReason);
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Warn`, PunishReason, undefined, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.warn`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        if (this.Guild.ConfigurationManager.get("moderation.sendWarnInDM"))this.sendUserPunishment(CommandExecution, CaseId, Punished.user.id, Punisher.user.id, `Warn`, PunishReason, undefined);
        return true;
    }

    async muteUser(CommandExecution: CommandExecution, Punished, PunishReason, PunishDuration, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));

        let MuteRole = await this.Guild.getRoleById(this.Guild.ConfigurationManager.get('moderation.muteRole'));
        let sendOption = {ephemeral: false} as {ephemeral: boolean, embeds: Array<any>, slashOnly: boolean | undefined};
        if (silent){
            sendOption.slashOnly = true;
            sendOption.ephemeral = true;
        }
        if (typeof MuteRole == "undefined" || MuteRole == null) return CommandExecution.returnErrorEmbed(sendOption, CommandExecution.i18n.__("moderation.muteRoleUndefined.title"), CommandExecution.i18n.__("moderation.muteRoleUndefined.description"));

        let Continue = await Punished.roles.add(MuteRole, this.Guild.i18n.__("moderation.auditLog.muteReason", {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id})).then(()=>true).catch(e => {
            CommandExecution.returnErrorEmbed(sendOption, CommandExecution.i18n.__("moderation.cannotAddMuteRole.title"), CommandExecution.i18n.__("moderation.cannotAddMuteRole.description", {error: e}));
            return false;
        });

        if (!Continue)return false;

        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Mute`, PunishReason, PunishDuration);
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Mute`, PunishReason, PunishDuration, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.mute`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        if (this.Guild.ConfigurationManager.get("moderation.sendMuteInDM"))this.sendUserPunishment(CommandExecution, CaseId, Punished.user.id, Punisher.user.id, `Mute`, PunishReason, PunishDuration);
        return true;
    }

    async unMuteUser(CommandExecution: CommandExecution, unPunished, unPunishReason): Promise<boolean> {
        let unPunisher = await this.Guild.getMemberById(CommandExecution.Executor.id);

        let MuteRole = await this.Guild.getRoleById(this.Guild.ConfigurationManager.get('moderation.muteRole'));

        await unPunished.roles.remove(MuteRole, this.Guild.i18n.__("moderation.auditLog.unMuteReason", {punishedId: unPunished.user.id, updaterTag: `${unPunisher.user.username}#${unPunisher.user.discriminator}`, updaterId: unPunisher.user.id, updateReason: unPunishReason, guildId: this.Guild.Guild.id})).then(async () => {
            this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='unmuted', \`updaterId\`=?, \`updateReason\`=?, \`updateTimestamp\`=? WHERE \`userId\`='${unPunished.user.id}' AND \`guildId\`='${this.Guild.Guild.id}' AND \`type\`='Mute' AND (\`status\`='active' OR \`status\`='indefinite')`, [unPunisher.user.id, unPunishReason, moment().format(`YYYY-MM-DD HH:mm-ss`)]);
            MainLog.log(this.Guild.GuildManager.TobyBot.i18n.__("bot.moderation.unmute", {punishedId: unPunished.user.id, updaterTag: `${unPunisher.user.username}#${unPunisher.user.discriminator}`, updaterId: unPunisher.user.id, updateReason: unPunishReason, guildId: this.Guild.Guild.id}));
        }).catch((e) => {
            if (!e.fatal)this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='unmuted', \`updaterId\`=?, \`updateReason\`=?, \`updateTimestamp\`=? WHERE \`userId\`='${unPunished.user.id}' AND \`guildId\`='${this.Guild.Guild.id}' AND \`type\`='Mute' AND (\`status\`='active' OR \`status\`='indefinite')`, [unPunisher.user.id, unPunishReason, moment().format(`YYYY-MM-DD HH:mm-ss`)]);
            if (e.code == 100) {
                ErrorLog.error(`Could not fetch the mute role, the mute role should be defined again. [Guild ${this.Guild.Guild.id}]`);
            } else {
                console.log("1", e);
            }
        });
        return true;
    }

    async kickUser(CommandExecution: CommandExecution, Punished: GuildMember, PunishReason, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));
        
        let sendOption = {ephemeral: false} as {ephemeral: boolean, embeds: Array<any>, slashOnly: boolean | undefined};
        if (silent){
            sendOption.slashOnly = true;
            sendOption.ephemeral = true;
        }

        let Continue = await Punished.kick(this.Guild.i18n.__("moderation.auditLog.kickReason", {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id})).then(()=>true).catch(e => {
            CommandExecution.returnErrorEmbed(sendOption, CommandExecution.i18n.__("moderation.cannotKick.title"), CommandExecution.i18n.__("moderation.cannotKick.description", {error: e}));
            return false;
        });

        if (!Continue)return false;

        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Kick`, PunishReason);
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Kick`, PunishReason, undefined, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.kick`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        if (this.Guild.ConfigurationManager.get("moderation.sendKickInDM"))this.sendUserPunishment(CommandExecution, CaseId, Punished.user.id, Punisher.user.id, `Kick`, PunishReason, undefined);
        return true;
    }

    async banUser(CommandExecution: CommandExecution, Punished: GuildMember, PunishReason: string, PunishDuration, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));
        
        let sendOption = {ephemeral: false} as {ephemeral: boolean, embeds: Array<any>, slashOnly: boolean | undefined};
        if (silent){
            sendOption.slashOnly = true;
            sendOption.ephemeral = true;
        }

        let Continue = await Punished.ban({
            days: 7,
            reason: this.Guild.i18n.__("moderation.auditLog.banReason", {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id})
        }).then(()=>true).catch(e => {
            CommandExecution.returnErrorEmbed(sendOption, CommandExecution.i18n.__("moderation.cannotBan.title"), CommandExecution.i18n.__("moderation.cannotBan.description", {error: e}));
            return false;
        });

        if (!Continue)return false;

        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Ban`, PunishReason, PunishDuration);
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Ban`, PunishReason, PunishDuration, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.ban`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        if (this.Guild.ConfigurationManager.get("moderation.sendBanInDM"))this.sendUserPunishment(CommandExecution, CaseId, Punished.user.id, Punisher.user.id, `Ban`, PunishReason, PunishDuration);
        return true;
    }

    async banById(CommandExecution: CommandExecution, PunishedID, PunishReason, silent = false, asBot = false): Promise<boolean> {
        let Punisher = (await this.Guild.getMemberById((!asBot) ? CommandExecution.Executor.id : this.Guild.TobyBot.client.user.id));
        let Punished = await CommandExecution.TobyBot.client.users.fetch(PunishedID).then(user => { return { user: user}}).catch(e => { return {user: { username: 'UnknownTag', discriminator: 'XXXX', id: PunishedID, tag: 'UnknownTag#XXXX'}}; });

        let sendOption = {ephemeral: false} as {ephemeral: boolean, embeds: Array<any>, slashOnly: boolean | undefined};
        if (silent){
            sendOption.slashOnly = true;
            sendOption.ephemeral = true;
        }

        let Continue = await this.Guild.Guild.bans.create(Punished.user.id, {
            days: 7,
            reason: this.Guild.i18n.__("moderation.auditLog.banReason", {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id})
        }).then(()=>true).catch(e => {
            CommandExecution.returnErrorEmbed(sendOption, CommandExecution.i18n.__("moderation.cannotBan.title"), CommandExecution.i18n.__("moderation.cannotBan.description", {error: e}));
            return false;
        });

        if (!Continue)return false;

        let CaseId = await this.log(Punished.user.id, Punisher.user.id, `Ban`, PunishReason, );
        this.sendPunishEmbed(CommandExecution, CaseId, Punished, Punisher, `Ban`, PunishReason, undefined, silent);
        MainLog.log(CommandExecution.TobyBot.i18n.__(`bot.moderation.ban`, {punisherTag: `${Punisher.user.username}#${Punisher.user.discriminator}`, punisherId: Punisher.user.id, punishedTag: `${Punished.user.username}#${Punished.user.discriminator}`, punishedId: Punished.user.id, punishReason: PunishReason, guildId: this.Guild.Guild.id, caseId: CaseId}));
        return true;
    }

    async isUserPunished(PunishedId, type): Promise<boolean> {
        let _this = this;
        return new Promise((res, _rej) => {
            _this.Guild.SQLPool.query(`SELECT * FROM \`moderation\` WHERE \`userId\`='${PunishedId}' AND \`type\`='${type}' AND \`guildId\`='${this.Guild.Guild.id}' AND (\`status\`='active' OR \`status\`='indefinite')`, async (error, results) => {
                if (error) throw new SQLError('Could not fetch user pinishments.', {cause: error}).logError();
                if (results.length == 0) res(false);
                res(true);
            });
        });
    }

    async getPunishementByCaseId(caseId: string): Promise<Punishment | undefined> {
        let _this = this;
        return new Promise((res, rej) => {
            _this.Guild.SQLPool.query(`SELECT * FROM \`moderation\` WHERE \`numId\`='${caseId}' AND \`guildId\`='${this.Guild.Guild.id}'`, async (error, results) => {
                if (error) {
                    ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                    res(undefined);
                }
                if (results.length == 0) res(undefined);
                res(results[0]);
            });
        });
    }

    async deletePunishment(CommandExecution, caseId, removeReason): Promise<boolean> {
        let unPunisher = await this.Guild.getMemberById(CommandExecution.Executor.id);
        await this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='deleted', \`updaterId\`=?, \`updateReason\`=?, \`updateTimestamp\`=? WHERE \`numId\`='${caseId}'`, [unPunisher.user.id, removeReason, moment().format(`YYYY-MM-DD HH:mm-ss`)], async (error, results, _fields) => {
            if (error) {
                ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                return null;
            }
        });
        return true;
    }

    async clearExpired(): Promise<void> {
        return this.Guild.SQLPool.query(`SELECT * FROM \`moderation\` WHERE \`status\`='active'`, async (error, results, _fields) => {
            if (error) {
                ErrorLog.log(`An error occured trying to query the SQL pool. [${error.toString()}]`);
                return null;
            }
            if (typeof results != "undefined" && results != null && results.length != 0) {
                results.forEach(async indPunishment => {
                    if (moment(indPunishment.expires).isBefore(moment())){
                        let PunishmentGuild = await this.Guild.GuildManager.getGuildById(indPunishment.guildId);
                        let Updater = await PunishmentGuild.getMemberById(this.Guild.GuildManager.TobyBot.client.user.id);
                        let Punished = await PunishmentGuild.getMemberById(indPunishment.userId);
                        let UpdateReason = "Punishment expired.";
                        let PunishReason = indPunishment.reason;

                        if (typeof PunishmentGuild == "undefined")return ErrorLog.error(`Could not fetch guild ${indPunishment.guildId}`);

                        if (indPunishment.type == "Ban"){
                            await PunishmentGuild.Guild.bans.remove(indPunishment.userId, this.Guild.i18n.__("moderation.auditLog.unbanReason", {updaterTag: `${Updater.user.username}#${Updater.user.discriminator}`, updaterId: Updater.user.id, punishReason: PunishReason, updateReason: UpdateReason, guildId: indPunishment.guildId})).then(async () => {
                                this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='expired', \`updaterId\`='${this.Guild.GuildManager.TobyBot.ConfigurationManager.get('appId')}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishment.numId}`);
                                MainLog.log(this.Guild.GuildManager.TobyBot.i18n.__("bot.moderation.unban", {updaterTag: `${Updater.user.username}#${Updater.user.discriminator}`, updaterId: Updater.user.id, punishReason: PunishReason, updateReason: UpdateReason, guildId: indPunishment.guildId}));
                            }).catch((e) => {
                                if (!e.fatal)this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='expired', \`updaterId\`='${this.Guild.GuildManager.TobyBot.ConfigurationManager.get('appId')}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishment.numId}`);
                                if (e.code == 10026) {
                                    ErrorLog.error(`Could not fetch ban. The ban is probably already removed. [Guild ${indPunishment.guildId}]`);
                                } else {
                                    console.log("2", e);
                                }
                            });
                        }

                        if (indPunishment.type == "Mute") {
                            if (typeof Punished == "undefined"){
                                this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='expired', \`updaterId\`='${Updater.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishment.numId}`);
                                MainLog.log(this.Guild.GuildManager.TobyBot.i18n.__("bot.moderation.unmute", {punishedId: indPunishment.userId, updaterTag: `${Updater.user.username}#${Updater.user.discriminator}`, updaterId: Updater.user.id, punishReason: PunishReason, updateReason: UpdateReason, guildId: indPunishment.guildId}));
                                return true;
                            }
                            let MuteRole = await PunishmentGuild.getRoleById(PunishmentGuild.ConfigurationManager.get('moderation.muteRole'));

                            await Punished.roles.remove(MuteRole, this.Guild.i18n.__("moderation.auditLog.unMuteReason", {punishedId: indPunishment.userId, updaterTag: `${Updater.user.username}#${Updater.user.discriminator}`, updaterId: Updater.user.id, punishReason: PunishReason, updateReason: UpdateReason, guildId: indPunishment.guildId})).then(async () => {
                                this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='expired', \`updaterId\`='${Updater.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishment.numId}`);
                                MainLog.log(this.Guild.GuildManager.TobyBot.i18n.__("bot.moderation.unmute", {punishedId: indPunishment.userId, updaterTag: `${Updater.user.username}#${Updater.user.discriminator}`, updaterId: Updater.user.id, punishReason: PunishReason, updateReason: UpdateReason, guildId: indPunishment.guildId}));
                            }).catch((e) => {
                                if (!e.fatal)this.Guild.SQLPool.query(`UPDATE \`moderation\` SET \`status\`='expired', \`updaterId\`='${Updater.user.id}', \`updateReason\`='expired', \`updateTimestamp\`='${moment().format(`YYYY-MM-DD HH:mm-ss`)}' WHERE \`numId\`=${indPunishment.numId}`);
                                if (e.code == 100) {
                                    ErrorLog.error(`Could not fetch the mute role, the mute role should be defined again. [Guild ${indPunishment.guildId}]`);
                                } else {
                                    console.log("1", e);
                                }
                            });
                        }
                    }
                });
            }
        })
    }
}