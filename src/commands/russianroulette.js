const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const RussianRoulette = require('../classes/RussianRoulette')

module.exports = {
    name: "russianroulette",
    aliases: ["rr"],
    permission: "command.russianroulette",
    category: "fun",
    enabled: true,
    hasSlashCommand: true,
    async execute(CommandExecution) {
        if (typeof CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id] != "undefined")
            return CommandExecution.returnErrorEmbed({emphemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.alreadyrunning`));

        CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id] = new RussianRoulette(CommandExecution);
        CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id].init();
        CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id].start();
        return true;
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;

        CommandExecution.CommandOptions.forEach(async individualArgument => {
            if (individualArgument.toLowerCase().startsWith("-starttimer:")){
                try {
                    let time = parseInt(individualArgument.replace('-starttimer:', ``));
                    options.startTimer = time * 1000;
                    CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(arrayItem => arrayItem !== individualArgument);
                } catch (e) {}
            }
            if (individualArgument.toLowerCase().startsWith("-roundtimer:")){
                try {
                    let time = parseInt(individualArgument.replace('-roundtimer:', ``));
                    options.roundTimer = time * 1000;
                    CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(arrayItem => arrayItem !== individualArgument);
                } catch (e) {}
            }
            if (individualArgument.toLowerCase().startsWith("-winners:")){
                try {
                    let winners = parseInt(individualArgument.replace('-winners:', ``));
                    options.winners = winners;
                    CommandExecution.CommandOptions = CommandExecution.CommandOptions.filter(arrayItem => arrayItem !== individualArgument);
                } catch (e) {}
            }
        });
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.prize = CommandExecution.CommandOptions.pop();
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

        slashCommand.addIntegerOption(option => 
            option.setName('starttimer')
                .setDescription(i18n.__(`command.${this.name}.option.starttimer.description`))
                .setRequired(false)
        );

        slashCommand.addIntegerOption(option => 
            option.setName('winners')
                .setDescription(i18n.__(`command.${this.name}.option.winners.description`))
                .setRequired(false)
        );

        slashCommand.addStringOption(option => 
            option.setName('prize')
                .setDescription(i18n.__(`command.${this.name}.option.prize.description`))
                .setRequired(false)
        );


        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`) + '\n' + Command.CommandManager.i18n.__(`commands.generic.help.argsType`));
       
        returnObject.embeds.push(tempEmbed) 

        return returnObject;
    }
}