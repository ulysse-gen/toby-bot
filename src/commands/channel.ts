import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, StreamType, createAudioResource, AudioPlayerStatus, entersState, DiscordGatewayAdapterCreator } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import prettyMilliseconds from "pretty-ms";
import ytdl from 'ytdl-core';
import ytsearch from 'yt-search';
import { MusicSubscription } from '../classes/MusicSubscription';
import { Track } from '../classes/Track';
import CommandExecution from '../classes/CommandExecution';
import { I18n } from 'i18n';
import Command from '../classes/Command';

/*
channel rename <Channel> <NewName>
channel clonepermissions <Channel1> <Channel2>
channel savepermissions <Channel> <SaveName>
channel applypermissions <Channel> <PermissionName>
channel listpermissions <Channel>
channel listsavedpermissions
channel join <Channel>
channel leave
channel play <URL>
*/

module.exports = {
    name: "channel",
    aliases: ["channeledit"],
    permission: "command.channeledit",
    category: "administration",
    enabled: true,
    async execute(CommandExecution: CommandExecution) {

        if (CommandExecution.options.subCommand == "rename"){
            if (typeof CommandExecution.options.option1 == "undefined" || CommandExecution.options.option1.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.noChannel.description`, {}));
            if (typeof CommandExecution.options.option2 == "undefined" || CommandExecution.options.option2.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noName.title`), CommandExecution.i18n.__(`command.${this.name}.error.noName.description`, {}));

            const channel = await CommandExecution.Guild.getChannelFromArg(CommandExecution.options.option1);
            const name = CommandExecution.options.option2;

            if (!channel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchChannel.description`, {}));

            await channel.setName(name, CommandExecution.i18n.__(`command.${this.name}.rename.reason`, {userTag: CommandExecution.RealUser.User.tag, userId: CommandExecution.RealUser.id}));

            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.rename.success.title`), CommandExecution.i18n.__(`command.${this.name}.success.success.description`));
        }

        if (CommandExecution.options.subCommand == "clonepermissions"){
            if (typeof CommandExecution.options.option1 == "undefined" || CommandExecution.options.option1.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noSourceChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.noSourceChannel.description`, {}));
            if (typeof CommandExecution.options.option2 == "undefined" || CommandExecution.options.option2.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noReceiveChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.noReceiveChannel.description`, {}));

            const sourceChannel = await CommandExecution.Guild.getChannelFromArg(CommandExecution.options.option1);
            const receiveChannel = await CommandExecution.Guild.getChannelFromArg(CommandExecution.options.option2);

            if (!sourceChannel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchSourceChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchSourceChannel.description`, {}));
            if (!receiveChannel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchReceiveChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchReceiveChannel.description`, {}));

            if (sourceChannel.id === receiveChannel.id)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.sourceAndReceiveSameChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.sourceAndReceiveSameChannel.description`, {}));

            await receiveChannel.permissionOverwrites.set(sourceChannel.permissionOverwrites.cache, CommandExecution.i18n.__(`command.${this.name}.clonePermissions.reason`, {userTag: CommandExecution.RealUser.User.tag, userId: CommandExecution.RealUser.id}));

            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.clonePermissions.success.title`), CommandExecution.i18n.__(`command.${this.name}.clonePermissions.success.description`));
        }

        if (CommandExecution.options.subCommand == "savepermissions"){
            return CommandExecution.returnWarningEmbed({}, CommandExecution.i18n.__(`command.${this.name}.notDone.title`), CommandExecution.i18n.__(`command.${this.name}.notDone.description`));
        }

        if (CommandExecution.options.subCommand == "applypermissions"){
            return CommandExecution.returnWarningEmbed({}, CommandExecution.i18n.__(`command.${this.name}.notDone.title`), CommandExecution.i18n.__(`command.${this.name}.notDone.description`));
        }

        if (CommandExecution.options.subCommand == "listpermissions"){
            return CommandExecution.returnWarningEmbed({}, CommandExecution.i18n.__(`command.${this.name}.notDone.title`), CommandExecution.i18n.__(`command.${this.name}.notDone.description`));
        }
        
        if (CommandExecution.options.subCommand == "listsavedpermissions"){
            return CommandExecution.returnWarningEmbed({}, CommandExecution.i18n.__(`command.${this.name}.notDone.title`), CommandExecution.i18n.__(`command.${this.name}.notDone.description`));
        }

        if (CommandExecution.options.subCommand == "join"){
            if ((typeof CommandExecution.options.option1 == "undefined" || CommandExecution.options.option1.replaceAll(' ', '') == "") &&
            !CommandExecution.GuildExecutor.voice.channel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noChannelNorInVC.title`), CommandExecution.i18n.__(`command.${this.name}.error.noChannelNorInVC.description`, {}));
            
            const channel = await CommandExecution.Guild.getChannelFromArg(CommandExecution.options.option1, CommandExecution.GuildExecutor.voice.channel, "GUILD_VOICE");

            if (!channel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchChannel.title`), CommandExecution.i18n.__(`command.${this.name}.error.couldNotFetchChannel.description`, {}));
            
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
            });

            CommandExecution.Guild.MusicSubscription = new MusicSubscription(connection);

            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
            } catch (error) {
                return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.join.error.title`), CommandExecution.i18n.__(`command.${this.name}.join.error.description`));
            }

            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.join.success.title`), CommandExecution.i18n.__(`command.${this.name}.join.success.description`));
        }

        if (CommandExecution.options.subCommand == "leave"){
            if (!CommandExecution.Guild.MusicSubscription)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.notInVC.title`), CommandExecution.i18n.__(`command.${this.name}.error.notInVC.description`));
            await CommandExecution.Guild.MusicSubscription.voiceConnection.destroy();
            delete CommandExecution.Guild.MusicSubscription;
            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.leave.success.title`), CommandExecution.i18n.__(`command.${this.name}.leave.success.description`));
        }

        if (CommandExecution.options.subCommand == "pause"){
            if (!CommandExecution.Guild.MusicSubscription)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.title`), CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.description`));
            await CommandExecution.Guild.MusicSubscription.audioPlayer.pause();
            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.pause.success.title`));
        }

        if (CommandExecution.options.subCommand == "resume"){
            if (!CommandExecution.Guild.MusicSubscription)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.title`), CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.description`));
            await CommandExecution.Guild.MusicSubscription.audioPlayer.unpause();
            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.resume.success.title`));
        }

        if (CommandExecution.options.subCommand == "clear"){
            if (!CommandExecution.Guild.MusicSubscription)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.title`), CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.description`));
            CommandExecution.Guild.MusicSubscription.queue = [];
            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.clear.success.title`));
        }

        if (CommandExecution.options.subCommand == "skip"){
            if (!CommandExecution.Guild.MusicSubscription)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.title`), CommandExecution.i18n.__(`command.${this.name}.error.notPlaying.description`));
            await CommandExecution.Guild.MusicSubscription.audioPlayer.stop();
            return CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${this.name}.skip.success.title`));
        }

        if (CommandExecution.options.subCommand == "play"){
            if (typeof CommandExecution.options.option1 == "undefined" || CommandExecution.options.option1.replaceAll(' ', '') == "")return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.noURL.title`), CommandExecution.i18n.__(`command.${this.name}.error.noURL.description`, {}));
            if (!CommandExecution.Guild.MusicSubscription){
                if (!CommandExecution.GuildExecutor.voice.channel)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.error.notInVC.title`), CommandExecution.i18n.__(`command.${this.name}.error.notInVC.description`));
                const connection = joinVoiceChannel({
                    channelId: CommandExecution.GuildExecutor.voice.channel.id,
                    guildId: CommandExecution.GuildExecutor.voice.channel.guild.id,
                    adapterCreator: CommandExecution.GuildExecutor.voice.channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
                });
    
                CommandExecution.Guild.MusicSubscription = new MusicSubscription(connection);
    
                try {
                    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
                } catch (error) {
                    return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.join.error.title`), CommandExecution.i18n.__(`command.${this.name}.join.error.description`));
                }
            }

            let URL = CommandExecution.options.option1;
            if (!URL.startsWith('https://')){
                if (typeof CommandExecution.options.option2 != undefined)URL += " " + CommandExecution.options.option2;
                const results = await ytsearch(URL);
                if (results.videos.length == 0)return CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${this.name}.play.noVideoFound.title`), CommandExecution.i18n.__(`command.${this.name}.play.noVideoFound.description`));
                URL = results.videos[0].url;
            }

            const that = this;

            try {
                // Attempt to create a Track from the user's video URL
                const track = await Track.from(URL, {
                    onStart() {
                        return CommandExecution.sendSuccessEmbed(CommandExecution.i18n.__(`command.${that.name}.play.success.title`), CommandExecution.i18n.__(`command.${that.name}.play.success.description`, {title: track.title, length: track.length, url: track.url}));
                    },
                    onFinish() {
                        return CommandExecution.sendSuccessEmbed(CommandExecution.i18n.__(`command.${that.name}.play.finish.title`), CommandExecution.i18n.__(`command.${that.name}.play.finish.description`, {title: track.title, length: track.length, url: track.url}));
                    },
                    onError(error) {
                        return CommandExecution.sendErrorEmbed(CommandExecution.i18n.__(`command.${that.name}.play.error.title`), CommandExecution.i18n.__(`command.${that.name}.play.error.descriptionWithTrack`, {title: track.title, length: track.length, url: track.url}));
                    },
                });
                // Enqueue the track and reply a success message to the user
                CommandExecution.Guild.MusicSubscription.enqueue(track);
                await CommandExecution.returnSuccessEmbed({}, CommandExecution.i18n.__(`command.${that.name}.play.queued.title`), CommandExecution.i18n.__(`command.${that.name}.play.queued.description`, {title: track.title, length: track.length, url: track.url}));
            } catch (error) {
                console.warn(error);
                await CommandExecution.returnErrorEmbed({}, CommandExecution.i18n.__(`command.${that.name}.play.error.title`), CommandExecution.i18n.__(`command.${that.name}.play.error.descriptionWithoutTrack`));
            }
            return;
        }
        
        return CommandExecution.returnErrorEmbed({ephemeral: null}, CommandExecution.i18n.__(`command.generic.unknownSubCommand.title`), CommandExecution.i18n.__(`command.generic.unknownSubCommand.description`, {command: this.name}));
    },
    async optionsFromArgs (CommandExecution: CommandExecution) {
        var options: any = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.subCommand = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.option1 = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.option2 = CommandExecution.CommandOptions.join(' ');
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

            

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('rename')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addChannelOption(option => 
                    option.setName('channel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                subCommand.addStringOption(option => 
                    option.setName('name')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('clonepermissions')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addChannelOption(option => 
                    option.setName('sourcechannel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                subCommand.addChannelOption(option => 
                    option.setName('receivechannel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('savepermissions')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addChannelOption(option => 
                    option.setName('channel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                subCommand.addStringOption(option => 
                    option.setName('permissionsetname')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('applypermissions')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addChannelOption(option => 
                    option.setName('channel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                subCommand.addStringOption(option => 
                    option.setName('permissionsetname')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('listpermissions')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addChannelOption(option => 
                    option.setName('channel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('listsavedpermissions')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('join')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addChannelOption(option => 
                    option.setName('channel')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(false)
                )

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('leave')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('pause')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('resume')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('skip')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('clear')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                return subCommand;
            });
            
            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('play')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.description`));

                subCommand.addStringOption(option => 
                    option.setName('url')
                        .setDescription(i18n.__(`command.${this.name}.subcommand.${subCommand.name}.${option.name}.description`))
                        .setRequired(true)
                )

                return subCommand;
            });

        return slashCommand;
    }
}