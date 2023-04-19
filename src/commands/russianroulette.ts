import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import CommandExecution from '../classes/CommandExecution';
import { I18n } from 'i18n';
import RussianRoulette from '../classes/RussianRoulette';

module.exports = {
    name: "russianroulette",
    aliases: ["rr"],
    permission: "command.russianroulette",
    category: "fun",
    enabled: true,
    hasSlashCommand: true,
    permissions: {
        cancel: "command.russianroulette.cancel",
        stop: "command.russianroulette.stop",
        join: "command.russianroulette.play",
        leave: "command.russianroulette.play",
    },
    async execute(CommandExecution: CommandExecution) {
        if (typeof CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id] != "undefined")
            return CommandExecution.returnErrorEmbed({emphemeral: null}, CommandExecution.i18n.__(`command.${this.name}.error.alreadyrunning`));

        CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id] = new RussianRoulette(CommandExecution);
        CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id].init();
        CommandExecution.Guild.data.russianroulette.channels[CommandExecution.Channel.id].start();
        return true;
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
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
    async optionsFromSlashOptions (CommandExecution: CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [(val as {name: string, value: string}).name, (val as {name: string, value: any}).value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n: I18n) {
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
    }
}