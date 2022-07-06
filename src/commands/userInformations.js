const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: "userinformations",
    aliases: ["userinfos"],
    permission: "command.userinformations",
    category: "infos",
    enabled: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTargetSpecified.description`, {}));
    
        let User = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target);
        if (typeof User == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));
        let UserPFP = await CommandExecution.Guild.getUserPfp(User);

        let embed = new MessageEmbed({
            title: CommandExecution.i18n.__(`command.${this.name}.embed.title`),
            description: CommandExecution.i18n.__(`command.${this.name}.embed.description`, {userId: User.user.id, userTag: User.user.tag}),
            color: User.displayHexColor,
            author: {
                name: User.user.tag,
                iconURL: `${UserPFP}?size=64`
            }
        });

        let userRoles = [];
        let userPermissions = [];
        let memberRoles = (User.roles.cache).sort((a,b) =>  b.rawPosition-a.rawPosition);
        memberRoles.forEach(memberRole => {
            if (memberRole.name != "@everyone") userRoles.push(memberRole.id);
            let perms = memberRole.permissions.serialize(false);
            for (const permission in perms) {
                if (perms[permission] == true)
                    if (!userPermissions.includes(permission)) userPermissions.push(permission);
            }
        });
        let userAcknowledgements = toAcknowledgements(User, CommandExecution.Guild.guild, userPermissions);
        userPermissions = toKeyPermissions(userPermissions);

        let roleString = (userRoles.join(`> <@&`).length > 1024) ? `Too many roles to show.` : `<@&${userRoles.join(`> <@&`)}>`;
        roleString = (userRoles.length == 0) ? `None` : roleString;

        let permissionsString = (userPermissions.length == 0) ? `None` : userPermissions.join(', ');

        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.joined.name`), `<t:${moment(User.joinedTimestamp).unix()}>`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.registered.name`), `<t:${moment(User.user.createdTimestamp).unix()}>`, true);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.roles.name`, {amount: userRoles.length}), roleString, false);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.permissions.name`), permissionsString, false);
        embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.acknowledgements.name`), `${userAcknowledgements}`, false);
        /*Custom Specifications for the bot itself*/if (User.user.id == CommandExecution.TobyBot.client.user.id) embed.addField(CommandExecution.i18n.__(`command.${this.name}.embed.field.specs.name`), CommandExecution.i18n.__(`command.${this.name}.embed.field.specs.content`), false);
        embed.addField(`**Infos**`, `UserID: ${User.user.id} • <t:${moment().unix()}>`, false);

        return CommandExecution.returnRaw({embeds: [embed]});
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.target = CommandExecution.CommandOptions.shift();
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

        slashCommand.addUserOption(option => 
            option.setName('target')
                .setDescription(i18n.__(`command.${this.name}.option.target.description`))
                .setRequired(true)
        );

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));

        tempEmbed.addField('target', Command.CommandManager.i18n.__(`commands.generic.arg.fieldDescription`, {description: Command.CommandManager.i18n.__(`command.${this.name}.option.target.description`), type: Command.CommandManager.i18n.__(`commands.generic.type.user`)}));
        
        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}

function toKeyPermissions(userPermissions) {
    let newUserPermissions = [];
    if (userPermissions.includes(`ADMINISTRATOR`)) newUserPermissions.push(`**Administrator**`);
    if (userPermissions.includes(`MANAGE_GUILD`)) newUserPermissions.push(`Manage Server`);
    if (userPermissions.includes(`MANAGE_ROLES`)) newUserPermissions.push(`Manage Roles`);
    if (userPermissions.includes(`MANAGE_CHANNELS`)) newUserPermissions.push(`Manage Channels`);
    if (userPermissions.includes(`MANAGE_MESSAGES`)) newUserPermissions.push(`Manage Messages`);
    if (userPermissions.includes(`MANAGE_WEBHOOKS`)) newUserPermissions.push(`Manage Webhoocks`);
    if (userPermissions.includes(`MANAGE_NICKNAMES`)) newUserPermissions.push(`Manage Nicknames`);
    if (userPermissions.includes(`MANAGE_EMOJIS_AND_STICKERS`)) newUserPermissions.push(`Manage Emojis`);
    if (userPermissions.includes(`KICK_MEMBERS`)) newUserPermissions.push(`Kick Members`);
    if (userPermissions.includes(`BAN_MEMBERS`)) newUserPermissions.push(`Ban Members`);
    if (userPermissions.includes(`MENTION_EVERYONE`)) newUserPermissions.push(`Mention Everyone`);
    return newUserPermissions;
}

function toAcknowledgements(user, guild, userPermissions, ) {
    let currentAcknowledgements = `Server Member`;
    let serverModeratorArray = ['MANAGE_MESSAGES', 'MANAGE_NICKNAMES'];
    let serverAdministratorArray = ['ADMINISTRATOR'];
    if (user.premiumSince != null) currentAcknowledgements = `Server Booster`;
    if (serverModeratorArray.every(permission => {
            return userPermissions.includes(permission)
        })) currentAcknowledgements = `Server Moderator`;
    if (serverAdministratorArray.every(permission => {
            return userPermissions.includes(permission)
        })) currentAcknowledgements = `**Server Administrator**`;
    if (guild.ownerId == user.user.id) currentAcknowledgements = `***Server Owner***`;
    return currentAcknowledgements;
}