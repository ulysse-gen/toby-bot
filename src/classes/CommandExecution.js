/////////////////////////////////
//Command Manager
/////////////////////////////////


//Importing NodeJS Modules
const { MessageEmbed } = require("discord.js");
const { I18n } = require('i18n');
const { ErrorBuilder } = require("./Errors");

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');
const LocaleLog = new FileLogger('locale.log');

module.exports = class CommandExecution {
    constructor(trigger, command, commandOptions, CommandManager, isSlashCommand = false) {
        this.TobyBot = trigger.TobyBot.TobyBot;

        this.Trigger = trigger;
        this.Command = command;
        this.CommandOptions = commandOptions;
        this.IsSlashCommand = isSlashCommand;
        this.CommandManager = CommandManager;
        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/commands',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
            autoReload: true,
            missingKeyFn: (locale, value) => {
                LocaleLog.log('[Missing Locale][commands]' + value + ` in ` + locale);
                return value;
            },
        });
    }

    /**Execute the command
     * No arguments needed
     */
    async execute() {
        this.deferIfNeeded();
        await this.buildContext();
        if (typeof this.Command == "undefined")return this.unknownCommand((this.IsSlashCommand) ? this.Trigger.commandName : this.Trigger.content);
        if (typeof this.options.permissionDenied != "undefined")return this.denyPermission(this.options.permissionDenied);
        await this.logExecution();
        return this.Command.execute(this);
    }

    async deferIfNeeded() {
        let _this = this;
        return setTimeout(() => {
            if (!_this.Trigger.replied && !_this.Trigger.deferred && _this.IsSlashCommand){
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
        this.Executor = (this.IsSlashCommand) ? this.Trigger.user : this.Trigger.author;
        this.RealExecutor = (this.IsSlashCommand) ? this.Trigger.user : this.Trigger.author;
        this.GuildExecutor = await this.Trigger.TobyBot.Guild.Guild.members.fetch(this.Executor);
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
            if (this.IsSlashCommand) {
                this.Trigger.delete = async() => true; //We spoof the delete function so we can just call it anyway and it doesnt crash
                this.Trigger.replyOriginal = this.Trigger.reply;
                this.Trigger.reply = async(...args) => {
                    args[0].ephemeral = (typeof args[0].ephemeral == "boolean") ? args[0].ephemeral : true;
                    if (this.Trigger.replied) return (args[0].followUpIfReturned) ? this.Trigger.followUp(...args) : false;
                    return this.Trigger.replyOriginal(...args);
                }
            }else {
                this.Trigger.replyOriginal = this.Trigger.reply;
                this.Trigger.reply = async (...args) => {
                    if (args[0].slashOnly)return true;
                    return this.Trigger.replyOriginal(...args).then(message => {
                        if (typeof args[0].ephemeral == "boolean" && args[0].ephemeral) setTimeout(()=>{
                            message.delete().catch(e => false);
                        }, 10000);
                    });
                }

                for (const argument of this.CommandOptions) {
                    if (argument.startsWith('--')){
                        let modifier = argument.replace('--', '').split("=");
                        let modifierName = modifier.shift();
                        let modifierValue = modifier.shift();
        
                        if (["spoofExecutor"].includes(modifierName)){
                            let checkPermission = await this.CommandManager.hasPermissionPerContext(this, `commands.spoofExecutor`);
                            if (!checkPermission)return {permissionDenied: `commands.spoofExecutor`};
                            this.Executor = (await this.Guild.getMemberById(modifierValue));
        
                            this.spoofing = true;
                            this.CommandOptions = this.CommandOptions.filter(function(e) { return e !== argument });
                        }
        
                        if (["spoofChannel"].includes(modifierName)){
                            let checkPermission = await this.CommandManager.hasPermissionPerContext(this, `commands.spoofChannel`);
                            if (!checkPermission)return {permissionDenied: `commands.spoofChannel`};
                            this.Channel = await this.Guild.getChannelById(modifierValue);
        
                            this.spoofing = true;
                            this.CommandOptions = this.CommandOptions.filter(function(e) { return e !== argument; });
                        }
                    }
                }
            }
        } else {
            return true;
        }

        let checkPermission = await this.CommandManager.hasPermission(this);
        if (!checkPermission){
            this.optionsBackup = (this.IsSlashCommand) ? await this.Command.optionsFromSlashOptions(this, this.CommandOptions) : await this.Command.optionsFromArgs(this, this.CommandOptions);
            if (!checkPermission)return this.options = {permissionDenied: this.Command.permission};
        }

        this.options = (this.IsSlashCommand) ? await this.Command.optionsFromSlashOptions(this, this.CommandOptions) : await this.Command.optionsFromArgs(this, this.CommandOptions);
        return true;
    }

    async denyPermission(permission) {
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.logFailed')) {
            if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inSQL'))await this.TobyBot.SQLLogger.logCommandExecution(this, 'denied');
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole')))MainLog.log(this.TobyBot.i18n.__('bot.command.execution.permissionDenied', {user: `${this.Executor.username}#${this.Executor.discriminator}(${this.Executor.id})`, realUser: `${this.RealExecutor.username}#${this.RealExecutor.discriminator}(${this.RealExecutor.id})`, location: `${this.Channel.id}@${this.Channel.guild.id}`, realLocation: `${this.RealChannel.id}@${this.RealChannel.guild.id}`}));
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inChannel')) && typeof this.TobyBot.loggers.commandExecution != "undefined"){
                let embed = new MessageEmbed().setTitle(this.TobyBot.i18n.__('channelLogging.commandExecution.error.deny.title')).setDescription(this.TobyBot.i18n.__('channelLogging.commandExecution.error.deny.description', {command: `${this.Command.name} ${Object.entries(this.optionsBackup).map(([key, val]) => `**${key}**:${val}`).join(' ')}`})).setColor(this.TobyBot.ConfigurationManager.get('style.colors.error'));
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.description', {guildId: this.Guild.Guild.id, realGuildId: this.RealGuild.Guild.id}), true);
                if (typeof this.spoofing != "undefined") {
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.description', {guildId: this.Guild.Guild.id, realGuildId: this.RealGuild.Guild.id}), true);
                }
                this.TobyBot.loggers.commandExecution.logRaw({embeds: [embed]});
            }
        }
        if ((await this.Guild.ConfigurationManager.get('behaviour.returnErrorOnPermissionDenied')))this.returnErrorEmbed({}, this.i18n.__(`commands.generic.permissionDenied.title`), this.i18n.__(`commands.generic.permissionDenied.description`, {permission: this.options.permissionDenied}));
        
        if (await this.Guild.ConfigurationManager.get('logging.commandExecution.logFailed') && typeof this.Guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.commandExecution.error.deny.title')).setDescription(this.Guild.i18n.__('channelLogging.commandExecution.error.deny.description', {command: `${this.Command.name} ${Object.entries(this.optionsBackup).map(([key, val]) => `**${key}**:${val}`).join(' ')}`})).setColor(this.Guild.ConfigurationManager.get('style.colors.error'));
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
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole')))MainLog.log(this.TobyBot.i18n.__('bot.command.execution.unknownCommand', {user: `${this.Executor.username}#${this.Executor.discriminator}(${this.Executor.id})`, realUser: `${this.RealExecutor.username}#${this.RealExecutor.discriminator}(${this.RealExecutor.id})`, location: `${this.Channel.id}@${this.Channel.guild.id}`, realLocation: `${this.RealChannel.id}@${this.RealChannel.guild.id}`}));
            if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inChannel')) && typeof this.TobyBot.loggers.commandExecution != "undefined"){
                let embed = new MessageEmbed().setTitle(this.TobyBot.i18n.__('channelLogging.commandExecution.error.unknown.title')).setDescription(this.TobyBot.i18n.__('channelLogging.commandExecution.error.unknown.description', {command: commandDetails})).setColor(this.TobyBot.ConfigurationManager.get('style.colors.error'));
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.description', {guildId: this.Guild.Guild.id, realGuildId: this.RealGuild.Guild.id}), true);
                if (typeof this.spoofing != "undefined") {
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                    embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.description', {guildId: this.Guild.Guild.id, realGuildId: this.RealGuild.Guild.id}), true);
                }
                this.TobyBot.loggers.commandExecution.logRaw({embeds: [embed]});
            }
        }
        if ((await this.Guild.ConfigurationManager.get('behaviour.returnErrorOnUnknownCommand'))) this.returnErrorEmbed({}, this.i18n.__(`commands.generic.unknownCommand.title`), this.i18n.__(`commands.generic.unknownCommand.description`));
        
        if (await this.Guild.ConfigurationManager.get('logging.commandExecution.logFailed') && typeof this.Guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.commandExecution.error.unknown.title')).setDescription(this.Guild.i18n.__('channelLogging.commandExecution.error.unknown.description', {command: commandDetails})).setColor(this.Guild.ConfigurationManager.get('style.colors.error'));
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
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole'))MainLog.log(this.TobyBot.i18n.__((typeof this.spoofing != "undefined") ? 'bot.command.execution.spoofed' : 'bot.command.execution', {user: `${this.Executor.username}#${this.Executor.discriminator}(${this.Executor.id})`, realUser: `${this.RealExecutor.username}#${this.RealExecutor.discriminator}(${this.RealExecutor.id})`, command: `${this.Command.name}`, location: `${this.Channel.id}@${this.Channel.guild.id}`, realLocation: `${this.RealChannel.id}@${this.RealChannel.guild.id}`}));
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inChannel') && typeof this.TobyBot.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.TobyBot.i18n.__('channelLogging.commandExecution.title')).setDescription(this.TobyBot.i18n.__('channelLogging.commandExecution.description', {command: `${this.Command.name} ${Object.entries(this.options).map(([key, val]) => `**${key}**:${val}`).join(' ')}`})).setColor(this.Guild.ConfigurationManager.get('style.colors.main'));
            embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
            embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
            embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.guild.description', {guildId: this.Guild.Guild.id, realGuildId: this.RealGuild.Guild.id}), true);
            if (typeof this.spoofing != "undefined") {
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.Executor.id, realUserId: this.RealExecutor.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.Channel.id, realChannelId: this.RealChannel.id}), true);
                embed.addField(this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.title'), this.TobyBot.i18n.__('channelLogging.commandExecution.field.realGuild.description', {guildId: this.Guild.Guild.id, realGuildId: this.RealGuild.Guild.id}), true);
            }
            this.TobyBot.loggers.commandExecution.logRaw({embeds: [embed]});
        }
        
        if (await this.Guild.ConfigurationManager.get('logging.commandExecution.inChannel') && typeof this.Guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.Guild.i18n.__('channelLogging.commandExecution.title')).setDescription(this.Guild.i18n.__('channelLogging.commandExecution.description', {command: `${this.Command.name} ${Object.entries(this.options).map(([key, val]) => `**${key}**:${val}`).join(' ')}`})).setColor(this.Guild.ConfigurationManager.get('style.colors.main'));
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
        let contextReturn = {guildId: this.Guild.Guild.id, channelId: this.Channel.id, triggerId: this.Trigger.id, executorId: this.Executor.id, IsSlashCommand: this.IsSlashCommand};
        if (typeof this.spoofing == "boolean" && this.spoofing)contextReturn = Object.assign({spoofedFrom: {guildId: this.RealGuild.Guild.id, channelId: this.RealChannel.id, executorId: this.RealExecutor.id} }, locationReturn);

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
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new ErrorBuilder('Title must be a non empty string.').setType("TYPE_ERROR").logError();
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
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new ErrorBuilder('Title must be a non empty string.').setType("TYPE_ERROR").logError();
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));
        
        return this.Channel.send({embeds: [embed]}).then(message=>message);
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendMainEmbed(title, description = undefined, fields = []){
        return this.sendEmbed(title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendSuccessEmbed(title, description = undefined, fields = []){
        return this.sendEmbed(title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.success'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendErrorEmbed(title, description = undefined, fields = []){
        return this.sendEmbed(title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendWarningEmbed(title, description = undefined, fields = []){
        return this.sendEmbed(title, description, fields, this.Trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
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
        return this.Channel.send(...args).then(message => message);
    }
}