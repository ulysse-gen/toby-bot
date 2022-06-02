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
        let permission = await this.CommandManager.hasPermission(this).catch(e => { throw e; });
        if (!permission){
            this.returnErrorEmbed({}, this.i18n.__(`commands.generic.permissionDenied.title`), this.i18n.__(`commands.generic.permissionDenied.description`, {permission: this.command.permission}));
            return false;
        }
        MainLog.log(this.TobyBot.i18n.__((typeof this.spoofing != "undefined") ? 'bot.command.execution.spoofed' : 'bot.command.execution', {user: `${this.executor.username}#${this.executor.discriminator}(${this.executor.id})`, realUser: `${this.realExecutor.username}#${this.realExecutor.discriminator}(${this.realExecutor.id})`, command: `${this.command.name}`, location: `${this.channel.id}@${this.channel.guild.id}`, realLocation: `${this.realChannel.id}@${this.realChannel.guild.id}`}));
        return this.command.execute(this).catch(e => { throw e; });
    }

    /**Build the command context
     * No arguments needed
     */
    async buildContext() {
        this.executor = (this.isSlashCommand) ? this.trigger.user : this.trigger.author;
        this.realExecutor = (this.isSlashCommand) ? this.trigger.user : this.trigger.author;
        this.guildExecutor = await this.trigger.TobyBot.guild.guild.members.fetch(this.executor).catch(e => {
            throw e;
        });
        this.channel = this.trigger.channel;
        this.realChannel = this.channel;

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
                        message.delete().catch(e => { 
                            ErrorLog.error(`${__filename}: An error occured trying to delete a message, the message is probably deleted already.`);
                        });
                    }, 10000);
                }).catch(e => { 
                    ErrorLog.error(`${__filename}: An error occured trying to reply to a message, the message is probably deleted already.`);
                });
            }

            for (const argument of this.commandOptions) {
                if (argument.startsWith('--')){
                    let modifier = argument.replace('--', '').split("=");
                    let modifierName = modifier.shift();
                    let modifierValue = modifier.shift();
    
                    if (["spoofExecutor"].includes(modifierName)){
                        this.executor = (await this.trigger.TobyBot.guild.getMemberById(modifierValue)).user;
    
                        this.spoofing = true;
                        this.commandOptions = this.commandOptions.filter(function(e) { return e !== argument });
                    }
    
                    if (["spoofChannel"].includes(modifierName)){
                        this.channel = await this.trigger.TobyBot.guild.getChannelById(modifierValue);
    
                        this.spoofing = true;
                        this.commandOptions = this.commandOptions.filter(function(e) { return e !== argument; });
                    }
                }
            }
        }

        this.options = (this.isSlashCommand) ? this.command.optionsFromSlashOptions(this.commandOptions) : this.command.optionsFromArgs(this.commandOptions);
        return this;
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
        if (typeof title != "string" || title.replaceAll(" ", "") == "")throw `Title must be a non empty string`;
        var returnOptions = Object.assign({ephemeral: true, slashOnly: false, followUpIfReturned: false}, options);
        if (returnOptions.slashOnly && !this.isSlashCommand)return true;
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));

        returnOptions.embeds = [embed];
        
        return this.trigger.reply(returnOptions).catch(e => {
            throw e;
        });
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Finish the execution by returning an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:false, followUpIfReturned:Boolean:false}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async returnWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.returnEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async replyEmbed(options = {}, title, description = undefined, fields = []){
        args[0] = Object.assign({followUpIfReturned: true}, args[0]);
        return this.returnEmbed(...args).catch(e=>{throw e;});
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Reply to the execution by replying an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param options {ephemeral:Boolean:true, slashOnly:Boolean:true}
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async replyWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.replyEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
    }


    /** Finish the execution by sending an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async sendEmbed(title, description = undefined, fields = [], color = this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main')){
        if (typeof title != "string" || title.replaceAll(" ", "") == "")throw `Title must be a non empty string`;
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));
        
        return this.channel.send({embeds: [embed]}).catch(e => {
            throw e;
        });
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendMainEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendErrorEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Reply to the execution by replying an embed
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async sendWarningEmbed(options = {}, title, description = undefined, fields = []){
        return this.sendEmbed(options, title, description, fields, this.trigger.TobyBot.guild.ConfigurationManager.get('style.colors.warning'));
    }
}