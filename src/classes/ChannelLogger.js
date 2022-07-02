const {MessageEmbed} = require('discord.js');

module.exports = class ChannelLogger {
    constructor(Guild, channelLoggingConfig) {
        this.Guild = Guild;
        this.config = channelLoggingConfig;

        this.initialized = false;
    }

    async initialize() {
        if (!this.config.inChannel || this.config.channel == "none")return false;
        return this.Guild.guild.channels.fetch(this.config.channel).then(channel => {
            this.channel = channel;
            this.initialized = true;
            return true;
        });
    }

    /** Log text
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param content Content to log
     */
    async log(content) {
        if (!this.initialized)return false;
        if (typeof content != "string" || content.replaceAll(" ", "") == "") throw new Error('Content must be a non empty string.');
        return this.channel.send(content);
    }

    async logRaw(options) {
        if (!this.initialized)return false;
        return this.channel.send(options);
    }

    /** Log with an embed
     *  Objects will be described as such : {keyName:keyType:Optional?} (e.g. {thisIsAKey:String:true})
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     * @param color Color of the embed
     */
     async logEmbed(title, description = undefined, fields = [], color = this.Guild.ConfigurationManager.get('style.colors.main')){
         if (!this.initialized)return false;
        if (typeof title != "string" || title.replaceAll(" ", "") == "") throw new Error('Title must be a non empty string.');
        let embed = new MessageEmbed().setTitle(title).setColor(color);
        if (typeof description == "string" && description.replaceAll(' ', '') != "") embed.setDescription(description);
        if (typeof fields == "object" && fields.length > 0)
            fields.forEach(indField => embed.addField(indField[0], indField[1], indField[2]));
        
        return this.channel.send({embeds: [embed]});
    }

    /** Log with an embed with main color
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async logMainEmbed(title, description = undefined, fields = []){
        return this.logEmbed(title, description, fields, this.Guild.ConfigurationManager.get('style.colors.main'));
    }

    /** Log with an embed with error color
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async logErrorEmbed(title, description = undefined, fields = []){
        return this.logEmbed(title, description, fields, this.Guild.ConfigurationManager.get('style.colors.error'));
    }

    /** Log with an embed with warning color
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async logWarningEmbed(title, description = undefined, fields = []){
        return this.logEmbed(title, description, fields, this.Guild.ConfigurationManager.get('style.colors.warning'));
    }

    /** Log with an embed with success color
     * @param title Title of the embed
     * @param description Description of the embed
     * @param fields Fields array of the embed
     */
     async logSuccessEmbed(title, description = undefined, fields = []){
        return this.logEmbed(title, description, fields, this.Guild.ConfigurationManager.get('style.colors.success'));
    }
}