/////////////////////////////////
//Command Manager
/////////////////////////////////


//Importing NodeJS Modules
const { MessageEmbed } = require("discord.js");

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

module.exports = class CommandExecution {
    constructor(trigger, command, commandOptions, CommandManager, isSlashCommand = false) {
        this.TobyBot = trigger.TobyBot.TobyBot;

        this.trigger = trigger;
        this.command = command;
        this.commandOptions = commandOptions;
        this.isSlashCommand = isSlashCommand;
        this.CommandManager = CommandManager;
        this.i18n = CommandManager.i18n;

        this.replied = false;
    }

    /**Execute the command
     * No arguments needed
     */
    async execute() {
        await this.buildContext().catch(e => { throw e; });
        this.deferIfNeeded();
        if (typeof this.command == "undefined")return this.unknownCommand();
        if (typeof this.options.permissionDenied != "undefined")return this.denyPermission(this.options.permissionDenied);
        await this.logExecution();
        return this.command.execute(this).catch(e => { throw e; });
    }

    async deferIfNeeded() {
        let _this = this;
        return setTimeout(() => {
            if (!_this.replied && _this.isSlashCommand){
                _this.replied = true;
                _this.trigger.reply = async(...args) => {
                    return _this.trigger.editReply(...args).catch(e => { throw e; });
                }
                return _this.trigger.deferReply({ephemeral: true});
            }
        }, 2000);
    }

    /**Build the command context
     * No arguments needed
     */
    async buildContext() {
        this.executor = (this.isSlashCommand) ? this.trigger.user : this.trigger.author;
        this.realExecutor = (this.isSlashCommand) ? this.trigger.user : this.trigger.author;
        this.guildExecutor = await this.trigger.TobyBot.guild.guild.members.fetch(this.executor).catch(e => { throw e; });
        this.channel = this.trigger.channel;
        this.realChannel = this.channel;
        this.guild = this.trigger.TobyBot.guild;
        this.realGuild = this.guild;

        if (typeof this.command != "undefined") {
            if (this.isSlashCommand) {
                this.trigger.delete = async() => true; //We spoof the delete function so we can just call it anyway and it doesnt crash
                this.trigger.replyOriginal = this.trigger.reply;
                this.trigger.reply = async(...args) => {
                    if (this.replied) return (args[0].followUpIfReturned) ? this.trigger.followUp(...args).catch(e => { throw e; }) : false;
                    this.replied = true;
                    return this.trigger.replyOriginal(...args).catch(e => { throw e; });
                }
            }else {
                this.trigger.replyOriginal = this.trigger.reply;
                this.trigger.reply = async (...args) => {
                    if (args[0].slashOnly)return true;
                    return this.trigger.replyOriginal(...args).then(message => {
                        if (args[0].ephemeral) setTimeout(()=>{
                            message.delete().catch(e => { throw e; });
                        }, 10000);
                    }).catch(e => { throw e; });
                }

                for (const argument of this.commandOptions) {
                    if (argument.startsWith('--')){
                        let modifier = argument.replace('--', '').split("=");
                        let modifierName = modifier.shift();
                        let modifierValue = modifier.shift();
        
                        if (["spoofExecutor"].includes(modifierName)){
                            let checkPermission = await this.CommandManager.hasPermissionPerContext(this, `commands.spoofExecutor`).catch(e => { throw e; });
                            if (!checkPermission)return {permissionDenied: `commands.spoofExecutor`};
                            this.executor = (await this.guild.getMemberById(modifierValue).catch(e => { throw e; })).user;
        
                            this.spoofing = true;
                            this.commandOptions = this.commandOptions.filter(function(e) { return e !== argument });
                        }
        
                        if (["spoofChannel"].includes(modifierName)){
                            let checkPermission = await this.CommandManager.hasPermissionPerContext(this, `commands.spoofChannel`).catch(e => { throw e; });
                            if (!checkPermission)return {permissionDenied: `commands.spoofChannel`};
                            this.channel = await this.guild.getChannelById(modifierValue).catch(e => { throw e; });
        
                            this.spoofing = true;
                            this.commandOptions = this.commandOptions.filter(function(e) { return e !== argument; });
                        }
                    }
                }
            }
        } else {
            return true;
        }

        let checkPermission = await this.CommandManager.hasPermission(this).catch(e => { throw e; });
        if (!checkPermission)return this.options = {permissionDenied: this.command.permission};

        this.options = (this.isSlashCommand) ? await this.command.optionsFromSlashOptions(this, this.commandOptions) : await this.command.optionsFromArgs(this, this.commandOptions);
        return true;
    }

    async denyPermission(permission) {
        if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole')) && (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.logFailed')))MainLog.log(this.TobyBot.i18n.__('bot.command.execution.permissionDenided', {user: `${this.executor.username}#${this.executor.discriminator}(${this.executor.id})`, realUser: `${this.realExecutor.username}#${this.realExecutor.discriminator}(${this.realExecutor.id})`, command: `${this.command.name}`, location: `${this.channel.id}@${this.channel.guild.id}`, realLocation: `${this.realChannel.id}@${this.realChannel.guild.id}`, permission: permission}));
        if ((await this.guild.ConfigurationManager.get('behaviour.returnErrorOnPermissionDenied')))this.returnErrorEmbed({}, this.i18n.__(`commands.generic.permissionDenied.title`), this.i18n.__(`commands.generic.permissionDenied.description`, {permission: this.options.permissionDenied}));
        
        if (await this.guild.ConfigurationManager.get('logging.commandExecution.logFailed') && typeof this.guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.guild.i18n.__('channelLogging.commandExecution.error.deny.title')).setDescription(this.guild.i18n.__('channelLogging.commandExecution.error.deny.description', {command: `||I need to build this text, for now on, ignore. Try to DM me sometimes when you notice this so like that it kinda force me to work on it lol||`})).setColor(this.guild.ConfigurationManager.get('style.colors.error'));
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.executor.title'), this.guild.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.executor.id, realUserId: this.realExecutor.id}), true);
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.channel.title'), this.guild.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.channel.id, realChannelId: this.realChannel.id}), true);
            if (typeof this.spoofing != "undefined") embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.guild.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.executor.id, realUserId: this.realExecutor.id}), true);
            if (typeof this.spoofing != "undefined") embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.guild.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.channel.id, realChannelId: this.realChannel.id}), true);
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.permission.title'), this.guild.i18n.__('channelLogging.commandExecution.field.permission.description', {permission: this.command.permission}), true);
            this.guild.loggers.commandExecution.logRaw({embeds: [embed]}).catch(e => {throw e;});
        }
        
        return true;
    }

    async unknownCommand() {
        if ((await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole')) && (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.logFailed')))MainLog.log(this.TobyBot.i18n.__('bot.command.execution.unknownCommand', {user: `${this.executor.username}#${this.executor.discriminator}(${this.executor.id})`, realUser: `${this.realExecutor.username}#${this.realExecutor.discriminator}(${this.realExecutor.id})`, location: `${this.channel.id}@${this.channel.guild.id}`, realLocation: `${this.realChannel.id}@${this.realChannel.guild.id}`}));
        if ((await this.guild.ConfigurationManager.get('behaviour.returnErrorOnUnknownCommand'))) this.returnErrorEmbed({}, this.i18n.__(`commands.generic.unknownCommand.title`), this.i18n.__(`commands.generic.unknownCommand.description`));
        
        if (await this.guild.ConfigurationManager.get('logging.commandExecution.logFailed') && typeof this.guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.guild.i18n.__('channelLogging.commandExecution.error.unknown.title')).setDescription(this.guild.i18n.__('channelLogging.commandExecution.error.unknown.description', {command: `||I need to build this text, for now on, ignore. Try to DM me sometimes when you notice this so like that it kinda force me to work on it lol||`})).setColor(this.guild.ConfigurationManager.get('style.colors.error'));
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.executor.title'), this.guild.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.executor.id, realUserId: this.realExecutor.id}), true);
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.channel.title'), this.guild.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.channel.id, realChannelId: this.realChannel.id}), true);
            if (typeof this.spoofing != "undefined") embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.guild.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.executor.id, realUserId: this.realExecutor.id}), true);
            if (typeof this.spoofing != "undefined") embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.guild.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.channel.id, realChannelId: this.realChannel.id}), true);
            this.guild.loggers.commandExecution.logRaw({embeds: [embed]}).catch(e => {throw e;});
        }

        return true;
    }

    async logExecution() {
        if (await this.TobyBot.ConfigurationManager.get('logging.commandExecution.inConsole'))
            MainLog.log(this.TobyBot.i18n.__((typeof this.spoofing != "undefined") ? 'bot.command.execution.spoofed' : 'bot.command.execution', {user: `${this.executor.username}#${this.executor.discriminator}(${this.executor.id})`, realUser: `${this.realExecutor.username}#${this.realExecutor.discriminator}(${this.realExecutor.id})`, command: `${this.command.name}`, location: `${this.channel.id}@${this.channel.guild.id}`, realLocation: `${this.realChannel.id}@${this.realChannel.guild.id}`}));
        
        if (await this.guild.ConfigurationManager.get('logging.commandExecution.inChannel') && typeof this.guild.loggers.commandExecution != "undefined"){
            let embed = new MessageEmbed().setTitle(this.guild.i18n.__('channelLogging.commandExecution.title')).setDescription(this.guild.i18n.__('channelLogging.commandExecution.description', {command: `${this.command.name} ${Object.entries(this.options).map(([key, val]) => `**${key}**:${val}`).join(' ')}`})).setColor(this.guild.ConfigurationManager.get('style.colors.main'));
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.executor.title'), this.guild.i18n.__('channelLogging.commandExecution.field.executor.description', {userId: this.executor.id, realUserId: this.realExecutor.id}), true);
            embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.channel.title'), this.guild.i18n.__('channelLogging.commandExecution.field.channel.description', {channelId: this.channel.id, realChannelId: this.realChannel.id}), true);
            if (typeof this.spoofing != "undefined") embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.realUser.title'), this.guild.i18n.__('channelLogging.commandExecution.field.realUser.description', {userId: this.executor.id, realUserId: this.realExecutor.id}), true);
            if (typeof this.spoofing != "undefined") embed.addField(this.guild.i18n.__('channelLogging.commandExecution.field.realChannel.title'), this.guild.i18n.__('channelLogging.commandExecution.field.realChannel.description', {channelId: this.channel.id, realChannelId: this.realChannel.id}), true);
            this.guild.loggers.commandExecution.logRaw({embeds: [embed]}).catch(e => {throw e;});
        }
                
        return true;
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true, followUpIfReturned: false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
    async returnEmbed(options = {}, title, description = undefined, fields = [], color = this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')){
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new Error('Title must be a non empty string.');
        var returnOptions = Object.assign({ephemeral: true, slashOnly: false, followUpIfReturned: false}, options);
        if (returnOptions.slashOnly && !this.isSlashCommand)return true;
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));

        returnOptions.embeds = [embed];
        
        return this.trigger.reply(returnOptions).catch(e => { throw e; });
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')).catch(e => { throw e; });
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnErrorEmbed(options = {}, title = this.i18n.__(`commands.generic.error.title`), description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error')).catch(e => { throw e; });
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnWarningEmbed(options = {}, title = this.i18n.__(`commands.generic.warning.title`), description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning')).catch(e => { throw e; });
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
        return this.returnEmbed(...args).catch(e=>{throw e;}).catch(e => { throw e; });
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')).catch(e => { throw e; });
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error')).catch(e => { throw e; });
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning')).catch(e => { throw e; });
    }


    /** Finish the execution by sending an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async sendEmbed(title, description = undefined, fields = [], color = this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')){
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new Error('Title must be a non empty string.');
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));
        
        return this.channel.send({embeds: [embed]}).catch(e => { throw e; });
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')).catch(e => { throw e; });
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error')).catch(e => { throw e; });
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning')).catch(e => { throw e; });
    }
}