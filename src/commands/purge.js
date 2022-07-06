const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Collection } = require('discord.js');

module.exports = {
    name: "purge",
    aliases: [],
    permission: "command.purge",
    category: "moderation",
    enabled: true,
    async execute(CommandExecution) {
        try {
            let amount = parseInt(CommandExecution.options.subCommand)
            if (!isNaN(amount)) CommandExecution.options.subCommand = parseInt(amount);
        } catch {}

        let lastMessage = (!CommandExecution.IsSlashCommand) ? CommandExecution.Trigger : CommandExecution.Channel.messages.fetch({limit: 1}).catch(e => {
            return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cannotGetLastMessage.title`), CommandExecution.i18n.__(`command.${this.name}.error.cannotGetLastMessage.description`, {}));
        });

        let purgeAny = async (number) => {
            if (typeof CommandExecution.options.amount == "undefined" && typeof number == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noAmountSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noAmountSpecified.description`, {}));
            if (typeof number != "number" && typeof CommandExecution.options.amount == "string")try {
                let amount = parseInt(CommandExecution.options.amount)
                if (isNaN(amount)) return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.title`), CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.description`, {}));
                CommandExecution.options.amount = amount
            } catch {
                return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.title`), CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.description`, {}));
            }
            if (typeof number == "number")CommandExecution.options.amount = number;
            await CommandExecution.replyMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.purging.any.title`, { amount: CommandExecution.options.amount }), CommandExecution.i18n.__(`command.${this.name}.purging.any.description`, { amount: CommandExecution.options.amount }));
            
            let filterFunction = (message) => message.id != CommandExecution.Trigger.id;

            let PurgedAmount = await purgeMessages(CommandExecution.Channel, CommandExecution.options.amount, filterFunction, lastMessage.id);
            if (typeof PurgedAmount == "boolean")return CommandExecution.returnErrorEmbed({followUpIfReturned: true}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotPurge.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotPurge.description`));
            return CommandExecution.returnSuccessEmbed({followUpIfReturned: true, ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.purged.any.title`, { amount: CommandExecution.options.amount, realAmount: PurgedAmount }), CommandExecution.i18n.__(`command.${this.name}.purged.any.description`, { amount: CommandExecution.options.amount, realAmount: PurgedAmount }));
        }

        let purgeUser = async () => {
            if (typeof CommandExecution.options.amount == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noAmountSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noAmountSpecified.description`, {}));
            if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noUSerSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noUSerSpecified.description`, {}));
            if (typeof CommandExecution.options.amount == "string")try {
                let amount = parseInt(CommandExecution.options.amount)
                if (isNaN(amount)) return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.title`), CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.description`, {}));
                CommandExecution.options.amount = amount
            } catch {
                return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.title`), CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.description`, {}));
            }
            let User = await CommandExecution.Guild.getUserFromArg(CommandExecution.options.target);
            if (typeof User == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.title`), CommandExecution.i18n.__(`command.${this.name}.error.userNotFound.description`, {}));
            await CommandExecution.replyMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.purging.user.title`, { userTag: User.user.tag, amount: CommandExecution.options.amount }), CommandExecution.i18n.__(`command.${this.name}.purging.user.description`, { userTag: User.user.tag, amount: CommandExecution.options.amount }));
            
            let filterFunction = (!CommandExecution.IsSlashCommand) ? (message) => message.author.id == User.user.id : (message) => (message.author.id == User.user.id && message.id != CommandExecution.Trigger.id);
            
            let PurgedAmount = await purgeMessages(CommandExecution.Channel, CommandExecution.options.amount, filterFunction, lastMessage.id);
            if (typeof PurgedAmount == "boolean")return CommandExecution.returnErrorEmbed({followUpIfReturned: true}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotPurge.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotPurge.description`));
            return CommandExecution.returnSuccessEmbed({followUpIfReturned: true, ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.purged.user.title`, { userTag: User.user.tag, amount: CommandExecution.options.amount, realAmount: PurgedAmount }), CommandExecution.i18n.__(`command.${this.name}.purged.user.description`, { userTag: User.user.tag, amount: CommandExecution.options.amount, realAmount: PurgedAmount }));
        }

        let purgeMatch = async () => {
            if (typeof CommandExecution.options.amount == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noAmountSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noAmountSpecified.description`, {}));
            if (typeof CommandExecution.options.target == "undefined")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noTextSpecified.title`), CommandExecution.i18n.__(`command.${this.name}.error.noTextSpecified.description`, {}));
            if (typeof CommandExecution.options.amount == "string")try {
                let amount = parseInt(CommandExecution.options.amount)
                if (isNaN(amount)) return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.title`), CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.description`, {}));
                CommandExecution.options.amount = amount
            } catch {
                return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.title`), CommandExecution.i18n.__(`command.${this.name}.error.cantParseAmount.description`, {}));
            }
            await CommandExecution.replyMainEmbed({}, CommandExecution.i18n.__(`command.${this.name}.purging.match.title`, { match: CommandExecution.options.target, amount: CommandExecution.options.amount }), CommandExecution.i18n.__(`command.${this.name}.purging.match.description`, { match: CommandExecution.options.target, amount: CommandExecution.options.amount }));
            
            let filterFunction = (!CommandExecution.IsSlashCommand) ? (message) => message.content.toLowerCase().includes(CommandExecution.options.target.toLowerCase()) : (message) => (message.content.toLowerCase().includes(CommandExecution.options.target.toLowerCase()) && message.id != CommandExecution.Trigger.id);
            
            let PurgedAmount = await purgeMessages(CommandExecution.Channel, CommandExecution.options.amount, filterFunction, lastMessage.id);
            if (typeof PurgedAmount == "boolean")return CommandExecution.returnErrorEmbed({followUpIfReturned: true}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotPurge.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotPurge.description`));
            return CommandExecution.returnSuccessEmbed({followUpIfReturned: true, ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.purged.match.title`, { match: CommandExecution.options.target, amount: CommandExecution.options.amount, realAmount: PurgedAmount }), CommandExecution.i18n.__(`command.${this.name}.purged.match.description`, { match: CommandExecution.options.target, amount: CommandExecution.options.amount, realAmount: PurgedAmount }));
        }

        if (typeof CommandExecution.options.subCommand == "string"){
            if (CommandExecution.options.subCommand == "any")return purgeAny();
            if (CommandExecution.options.subCommand == "user")return purgeUser();
            if (CommandExecution.options.subCommand == "match")return purgeMatch();
        } else if (typeof CommandExecution.options.subCommand == "number"){
            return purgeAny(CommandExecution.options.subCommand);
        } else {
            console.log(CommandExecution.options)
        }

        return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.generic.unknownSubCommand.title`), CommandExecution.i18n.__(`command.generic.unknownSubCommand.description`, {command: this.name}));
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.subCommand = CommandExecution.CommandOptions.shift();
        options.amount = CommandExecution.CommandOptions.pop();
        if (CommandExecution.CommandOptions.length != 0)options.target = CommandExecution.CommandOptions.shift();
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

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('any')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.any.description`));
    
                subCommand.addStringOption(option => 
                    option.setName('amount')
                        .setDescription(i18n.__(`command.${this.name}.option.amount.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('user')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.user.description`));
    
                subCommand.addUserOption(option => 
                    option.setName('target')
                        .setDescription(i18n.__(`command.${this.name}.option.user.target.description`))
                        .setRequired(true)
                )
    
                subCommand.addStringOption(option => 
                    option.setName('amount')
                        .setDescription(i18n.__(`command.${this.name}.option.amount.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('match')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.match.description`));

                subCommand.addStringOption(option => 
                    option.setName('target')
                        .setDescription(i18n.__(`command.${this.name}.option.match.target.description`))
                        .setRequired(true)
                )
    
                subCommand.addStringOption(option => 
                    option.setName('amount')
                        .setDescription(i18n.__(`command.${this.name}.option.amount.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

        return slashCommand;
    }
}

async function purgeMessages(Channel, Amount, filterFunction = undefined, lastMessageId = undefined) {                                  
    let runPer = 100;
    if (Amount <= runPer)return Channel.messages.fetch({limit: 100, cache: false, before: lastMessageId}).then(async fetchedMessages => {
                                                        if (typeof filterFunction == "function")fetchedMessages = fetchedMessages.filter(filterFunction);
                                                        let FetchedMessagesMap = await fetchedMessages.entries();
                                                        let FetchedMessagesArray = Array.from(FetchedMessagesMap).slice(0, Amount);
                                                        fetchedMessages = new Collection(new Map(FetchedMessagesArray));
                                                        return Channel.bulkDelete(fetchedMessages.filter(message => !message.pinned)).catch(e =>-1).then(()=>fetchedMessages.size)
                                                    }).catch(e=>{
                                                        console.log(e);
                                                        return -1;
                                                    });
                  
    let totalRemoved = 0;
    for (let currentlyRemoved = 0; currentlyRemoved <= Amount;) {
        currentlyRemoved = await purgeMessages(Channel, (Amount-currentlyRemoved > runPer) ? runPer : Amount-currentlyRemoved, filterFunction);
        totalRemoved += currentlyRemoved;
        if (currentlyRemoved <= 0)break;
    }
    return (totalRemoved >= 0) ? totalRemoved : false;
}