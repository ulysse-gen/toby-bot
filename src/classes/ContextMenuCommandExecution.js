/////////////////////////////////
//Command Manager
/////////////////////////////////


//Importing NodeJS Modules
const { MessageEmbed } = require("discord.js");
const { I18n } = require('i18n');

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = class ContextMenuCommandExecution {
    constructor(trigger, command, ContextMenuCommandManager) {
        this.TobyBot = trigger.TobyBot.TobyBot;

        this.Trigger = trigger;
        this.Command = command;
        this.ContextMenuCommandManager = ContextMenuCommandManager;
        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/commands',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
            autoReload: true,
        });
    }

    /**Execute the command
     * No arguments needed
     */
    async execute() {
        await this.buildContext();
        this.deferIfNeeded();
        if (typeof this.Command == "undefined")return this.unknownCommand(this.Trigger.commandName);
        if (typeof this.options != "undefined" && typeof this.options.permissionDenied != "undefined")return this.denyPermission(this.options.permissionDenied);
        await this.logExecution();
        return this.Command.execute(this);
    }

    async deferIfNeeded() {
        let _this = this;
        return setTimeout(() => {
            if (!_this.Trigger.replied && !_this.Trigger.deferred){
                _this.Trigger.reply = async(...args) => {
                    return _this.Trigger.editReply(...args);
                }
                return _this.Trigger.deferReply({ephemeral: true});
            }
        }, 2000);
    }

    /**Build the command context
     * No arguments needed
     */
    async buildContext() {
        this.Executor = this.Trigger.user;
        this.RealExecutor = this.Trigger.user;
        this.GuildExecutor = await this.Trigger.TobyBot.guild.guild.members.fetch(this.Executor);
        this.Channel = this.Trigger.channel;
        this.RealChannel = this.Channel;
        this.Guild = this.Trigger.TobyBot.guild;
        this.RealGuild = this.Guild;
        this.User = this.Trigger.TobyBot.user;
        this.RealUser = this.User;

        this.i18n.setLocale(this.Guild.locale);
        if (typeof this.User.ConfigurationManager != "undefined" && this.User.ConfigurationManager.initialized && typeof this.User.ConfigurationManager.get('locale') != "undefined" && this.User.ConfigurationManager.get('locale') != "followGuild"){
            if (this.Guild.ConfigurationManager.get('behaviour.allowUserLocale'))this.i18n.setLocale(this.User.ConfigurationManager.get('locale'));
        }

        if (typeof this.Command != "undefined") {
            this.Trigger.delete = async() => true; //We spoof the delete function so we can just call it anyway and it doesnt crash
                this.Trigger.replyOriginal = this.Trigger.reply;
                this.Trigger.reply = async(...args) => {
                    args[0].ephemeral = true;
                    if (this.Trigger.replied) return (args[0].followUpIfReturned) ? this.Trigger.followUp(...args) : false;
                    return this.Trigger.replyOriginal(...args);
                }
        } else {
            return true;
        }

        let checkPermission = await this.ContextMenuCommandManager.hasPermission(this);
        if (!checkPermission)return this.options = {permissionDenied: this.Command.permission};
        return true;
    }

    async denyPermission(permission) {
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.logFailed')) {
            if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inSQL'))await this.TobyBot.SQLLogger.logCommandExecution(this, 'denied');
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole')))MainLog.log(this.TobyBot.i18n.__('bot.contextCommandExecution.execution.permissionDenied', {user: `${this.Executor.username}#${this.Executor.discriminator}(${this.Executor.id})`, realUser: `${this.RealExecutor.username}#${this.RealExecutor.discriminator}(${this.RealExecutor.id})`, location: `${this.Channel.id}@${this.Channel.guild.id}`, realLocation: `${this.RealChannel.id}@${this.RealChannel.guild.id}`}));
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inChannel')) && typeof this.TobyBot.loggers.commandExecution != "undefined"){
                let embed = new MessageEmbed().setTitle(this.TobyBot.i18n.__('channelLogging.contextCommandExecution.error.deny.title')).setDescription(this.TobyBot.i18n.__('channelLogging.contextCommandExecution.error.deny.description', {command: `${this.Command.name}`})).setColor(this.TobyBot.ConfigurationManager.get('style.colors.error'));
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.description', {guildId: this.Guild.guild.id, realGuildId: this.RealGuild.guild.id}), true);
                if (typeof this.spoofing != "undefined") {
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.description', {guildId: this.Guild.guild.id, realGuildId: this.RealGuild.guild.id}), true);
                }
                this.TobyBot.loggers.commandExecution.logRaw({embeds: [embed]});
            }
        }
        if ((await this.Guild.ConfigurationManager.get('behaviour.returnErrorOnPermissionDenied')))this.returnErrorEmbed({}, this.i18n.__(`contextCommandExecution.generic.permissionDenied.title`), this.i18n.__(`contextCommandExecution.generic.permissionDenied.description`, {permission: this.options.permissionDenied}));
        
        if (await this.Guild.ConfigurationManager.get('logging.commandExecution.logFailed') && typeof this.Guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.contextCommandExecution.error.deny.title')).setDescription(this.Guild.i18n.__('channelLogging.contextCommandExecution.error.deny.description', {command: `${this.Command.name}`})).setColor(this.Guild.ConfigurationManager.get('style.colors.error'));
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.executor.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.channel.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            if (typeof this.spoofing != "undefined") {
                embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            }
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.permission.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.permission.description', {permission: this.Command.permission}), true);
            this.Guild.loggers.commandExecution.logRaw({embeds: [embed]});
        }
        
        return true;
    }

    async unknownCommand(commandDetails) {
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.logFailed')) {
            if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inSQL'))await this.TobyBot.SQLLogger.logCommandExecution(this, 'unknown');
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole')))MainLog.log(this.TobyBot.i18n.__('bot.contextCommandExecution.execution.unknownCommand', {user: `${this.Executor.username}#${this.Executor.discriminator}(${this.Executor.id})`, realUser: `${this.RealExecutor.username}#${this.RealExecutor.discriminator}(${this.RealExecutor.id})`, location: `${this.Channel.id}@${this.Channel.guild.id}`, realLocation: `${this.RealChannel.id}@${this.RealChannel.guild.id}`}));
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inChannel')) && typeof this.TobyBot.loggers.commandExecution != "undefined"){
                let embed = new MessageEmbed().setTitle(this.TobyBot.i18n.__('channelLogging.contextCommandExecution.error.unknown.title')).setDescription(this.TobyBot.i18n.__('channelLogging.contextCommandExecution.error.unknown.description', {command: commandDetails})).setColor(this.TobyBot.ConfigurationManager.get('style.colors.error'));
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.description', {guildId: this.Guild.guild.id, realGuildId: this.RealGuild.guild.id}), true);
                if (typeof this.spoofing != "undefined") {
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.description', {guildId: this.Guild.guild.id, realGuildId: this.RealGuild.guild.id}), true);
                }
                this.TobyBot.loggers.commandExecution.logRaw({embeds: [embed]});
            }
        }
        if ((await this.Guild.ConfigurationManager.get('behaviour.returnErrorOnUnknownCommand'))) this.returnErrorEmbed({}, this.i18n.__(`contextCommandExecution.generic.unknownCommand.title`), this.i18n.__(`contextCommandExecution.generic.unknownCommand.description`));
        
        if (await this.Guild.ConfigurationManager.get('logging.commandExecution.logFailed') && typeof this.Guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.contextCommandExecution.error.unknown.title')).setDescription(this.Guild.i18n.__('channelLogging.contextCommandExecution.error.unknown.description', {command: commandDetails})).setColor(this.Guild.ConfigurationManager.get('style.colors.error'));
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.executor.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.channel.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            if (typeof this.spoofing != "undefined") {
                embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            }
            this.Guild.loggers.commandExecution.logRaw({embeds: [embed]});
        }

        return true;
    }

    async logExecution() {
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inSQL'))await this.TobyBot.SQLLogger.logCommandExecution(this);
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole'))MainLog.log(this.TobyBot.i18n.__((typeof this.spoofing != "undefined") ? 'bot.contextCommandExecution.execution.spoofed' : 'bot.contextCommandExecution.execution', {user: `${this.Executor.username}#${this.Executor.discriminator}(${this.Executor.id})`, realUser: `${this.RealExecutor.username}#${this.RealExecutor.discriminator}(${this.RealExecutor.id})`, command: `${this.Command.name}`, location: `${this.Channel.id}@${this.Channel.guild.id}`, realLocation: `${this.RealChannel.id}@${this.RealChannel.guild.id}`}));
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inChannel') && typeof this.TobyBot.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.TobyBot.i18n.__('channelLogging.contextCommandExecution.title')).setDescription(this.Guild.i18n.__('channelLogging.contextCommandExecution.description', {command: `${this.Command.name}`})).setColor(this.Guild.ConfigurationManager.get('style.colors.main'));
            embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
            embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.description', {guildId: this.Guild.guild.id, realGuildId: this.RealGuild.guild.id}), true);
            if (typeof this.spoofing != "undefined") {
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.description', {guildId: this.Guild.guild.id, realGuildId: this.RealGuild.guild.id}), true);
            }
            this.TobyBot.loggers.commandExecution.logRaw({embeds: [embed]});
        }
        
        if (await this.Guild.ConfigurationManager.get('logging.commandExecution.inChannel') && typeof this.Guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.contextCommandExecution.title')).setDescription(this.Guild.i18n.__('channelLogging.contextCommandExecution.description', {command: `${this.Command.name}`})).setColor(this.Guild.ConfigurationManager.get('style.colors.main'));
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.executor.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
            embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.channel.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            if (typeof this.spoofing != "undefined") {
                embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.Guild.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.Guild.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            }
            this.Guild.loggers.commandExecution.logRaw({embeds: [embed]});
        }
                
        return true;
    }

    async makeSQLLog(type, specificity = undefined) {
        let contextReturn = {guildId: this.Guild.guild.id, channelId: this.Channel.id, triggerId: this.Trigger.id, executorId: this.Executor.id, IsSlashCommand: this.IsSlashCommand};
        if (typeof this.spoofing == "boolean" && this.spoofing)contextReturn = Object.assign({spoofedFrom: {guildId: this.RealGuild.guild.id, channelId: this.RealChannel.id, executorId: this.RealExecutor.id} }, locationReturn);

        let contentReturn = {};

        switch (specificity) {
            case 'unknown':
                contextReturn = Object.assign({unknownCommand: true}, contextReturn);
                contentReturn = (this.IsSlashCommand) ? { trigger: this.Trigger.commandName, isSlashCommand: this.IsSlashCommand } : { trigger: this.Trigger.content, isSlashCommand: this.IsSlashCommand }
                break;

            case 'denied':
                contextReturn = Object.assign({permissionDenied: true}, contextReturn);
                contentReturn = {command: this.Command.name, options: this.options, IsSlashCommand: this.IsSlashCommand};
                break;
        
            default:
                contentReturn = {command: this.Command.name, options: this.options, IsSlashCommand: this.IsSlashCommand};
                break;
        }

        switch (type) {
            case 'context':
                return JSON.stringify(contextReturn);

            case 'content':
                return JSON.stringify(contentReturn);
        
            default:
                return '{}';
        }
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true, followUpIfReturned: false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async returnEmbed(options = {}, title, description = undefined, fields = [], color = this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')){
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new Error('Title must be a non empty string.');
        var returnOptions = Object.assign({ephemeral: true, slashOnly: false, followUpIfReturned: false}, options);
        if (returnOptions.slashOnly && !this.IsSlashCommand)return true;
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));

        returnOptions.embeds = [embed];
        
        return this.Trigger.reply(returnOptions);
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnSuccessEmbed(options = {}, title, description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.success'));
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnErrorEmbed(options = {}, title = this.i18n.__(`commands.generic.error.title`), description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnWarningEmbed(options = {}, title = this.i18n.__(`commands.generic.warning.title`), description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async replyEmbed(...args){
        args[0] = Object.assign({followUpIfReturned: true}, args[0]);
        return this.returnEmbed(...args);
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replySuccessEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.success'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
    }


    /** Finish the execution by sending an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async sendEmbed(title, description = undefined, fields = [], color = this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')){
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new Error('Title must be a non empty string.');
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));
        
        return this.Channel.send({embeds: [embed]});
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendSuccessEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.success'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
    }

    async returnRaw(...args){
        var returnOptions = Object.assign({ephemeral: true, slashOnly: false, followUpIfReturned: false}, args[0]);
        if (returnOptions.slashOnly && !this.IsSlashCommand)return true;
        return this.Trigger.reply(...args);
    }

    async replyRaw(...args){
        args[0] = Object.assign({followUpIfReturned: true}, args[0]);
        if (returnOptions.slashOnly && !this.IsSlashCommand)return true;
        return this.returnRaw(...args);
    }

    async sendRaw(...args){
        if (returnOptions.slashOnly && !this.IsSlashCommand)return true;
        return this.Channel.send(...args);
    }
}