//Importing NodeJS modules
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const moment = require('moment');
const crypto = require('crypto');
const rn = require("random-number");

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');


module.exports = class RussianRoulette {
    constructor(CommandExecution) {
        this.CommandExecution = CommandExecution;
        this.i18n = CommandExecution.i18n;

        this.id = crypto.randomBytes(4).toString('hex');

        this.players = [];

        this.alivePlayers = [];
        this.deadPlayers = [];

        this.prize = undefined;
        this.winners = 1;

        this.status = 'prestart';
        this.startTimer = 30000;
        this.roundTimer = 10000;
        this.roundUserFetch = 5;

        this.timeElapsed = 0;

        this.intervals = [];
        this.timeouts = [];

        this.joinButton = new MessageButton().setCustomId(`russianroulette-join-${this.id}`).setLabel(this.i18n.__(`command.russianroulette.button.join`)).setStyle("SUCCESS");
        this.cancelButton = new MessageButton().setCustomId(`russianroulette-cancel-${this.id}`).setLabel(this.i18n.__(`command.russianroulette.button.cancel`)).setStyle("DANGER");
        this.stopButton = new MessageButton().setCustomId(`russianroulette-stop-${this.id}`).setLabel(this.i18n.__(`command.russianroulette.button.stop`)).setStyle("DANGER");
        this.aliveButton = new MessageButton().setCustomId(`russianroulette-alive-${this.id}`).setLabel(this.i18n.__(`command.russianroulette.button.alive`)).setStyle("SECONDARY");

        this.buttonSets = {
            "prestart": new MessageActionRow().addComponents(this.joinButton, this.cancelButton),
            "joining": new MessageActionRow().addComponents(this.joinButton, this.cancelButton),
            "playing": new MessageActionRow().addComponents(this.aliveButton, this.stopButton),
            "canceled": new MessageActionRow().addComponents(this.cancelButton)
        }

        this.messages = [];

        this.subPermissions = CommandExecution.Command.subPermissions;
    }

    async init() {
        if (this.CommandExecution.options.startTimer)this.startTimer = (this.CommandExecution.options.startTimer >= 5000) ? this.CommandExecution.options.startTimer : this.startTimer;
        if (this.CommandExecution.options.roundTimer)this.roundTimer = (this.CommandExecution.options.roundTimer >= 10000) ? this.CommandExecution.options.roundTimer : this.roundTimer;
        if (this.CommandExecution.options.winners)this.winners = (this.CommandExecution.options.winners >= 1) ? this.CommandExecution.options.winners : this.winners;
        if (this.CommandExecution.options.prize)this.prize = await this.getPrize(this.CommandExecution.options.prize);
        return true;
    }

    async start() {
        let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.${this.status}.title`, {timer: this.startTimer/1000}))
                                        .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                                        .setDescription(this.i18n.__(`command.russianroulette.${this.status}.description`, {prize: (typeof this.prize != "undefined") ? `and try to win: **${this.prize.display}**` : ``, playerAmount: this.players.length, playerList: this.players.join(', ')}));
    
        this.startMessage = await this.CommandExecution.sendRaw({embeds: [embed], components: (typeof this.buttonSets[this.status] != undefined) ? [this.buttonSets[this.status]] : []});
        if (this.startTimer >= 150000)this.startMessage.pin().catch(e=>{});
        this.status = "joining";
        this.countDown();
        await sleep(this.startTimer);
        if (this.cleared)return true;
        await this.startGame();
        return this.clear();
    }

    async countDown() {
        if (this.timeElapsed+2000 >= this.startTimer)return true;
        if (this.timeElapsed+2000 >= this.startTimer-5000)return this.alertStartSoon();
        this.timeElapsed+=2000;
        this.editMainMessage();
        await sleep(2000);
        if (this.cleared)return true;
        return this.countDown();
    }

    async editMainMessage() {
        let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.${this.status}.title`, {timer: (this.startTimer-this.timeElapsed)/1000}))
                                        .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                                        .setDescription(this.i18n.__(`command.russianroulette.${this.status}.description`, {prize: (typeof this.prize != "undefined") ? `and try to win: **${this.prize.display}**` : ``, playerAmount: this.players.length, playerList: this.players.join(', ')}));
    

        this.startMessage.edit({embeds: [embed], components: (typeof this.buttonSets[this.status] != undefined) ? [this.buttonSets[this.status]] : []}).catch(e=>{console.log(e)});
        return true;
    }

    async alertStartSoon() {
        let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.startingsoon.title`, {timer: this.startTimer/1000}))
                                        .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'));
    
        await this.CommandExecution.sendRaw({embeds: [embed], components: (typeof this.buttonSets[this.status] != undefined) ? [this.buttonSets[this.status]] : []})
        return this.editMainMessage();
    }

    async startGame() {
        if (this.players.length < 2)return this.cancel('notenoughplayers');

        this.status = "playing";
        let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.starting.title`))
                                        .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                                        .setDescription(this.i18n.__(`command.russianroulette.starting.description`, {prize: (typeof this.prize != "undefined") ? `and try to win: **${this.prize.display}**` : ``, playerAmount: this.players.length, playerList: this.players.join(', ')}));
    
        this.startingMessage = await this.CommandExecution.sendRaw({embeds: [embed], components: (typeof this.buttonSets[this.status] != undefined) ? [this.buttonSets[this.status]] : []});
        this.alivePlayers = this.players.map(p => p);
        return this.round();
    }

    async round() {
        if (this.roundMessage)delete this.roundMessage;
        this.roundControl = 0;

        if (this.alivePlayers.length > this.winners){
            let eliminatedPlayer = await this.fetchPlayer()
            if (this.cleared)return true;
            return this.round();
        }else {
            let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.finished.title${(this.alivePlayers.length != 1) ? '.multiple' : ''}`, {winnersAmount: this.alivePlayers.length, winnersId: `<@${this.alivePlayers.map(p => p.id).join('>, <@')}>`, winnersTag: `<@${this.alivePlayers.map(p => p.user.tag).join(', ')}>`}))
                .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                .setDescription(this.i18n.__(`command.russianroulette.finished.description${(this.alivePlayers.length != 1) ? '.multiple' : ''}`, {winnersAmount: this.alivePlayers.length, winnersId: `<@${this.alivePlayers.map(p => p.id).join('>, <@')}>`, winnersTag: `<@${this.alivePlayers.map(p => p.user.tag).join(', ')}>`}));
            await this.roundMessageAction({embeds: [embed]});
            if (this.prize && this.prize.run)for (const player of this.alivePlayers) {
                this.prize.run(this, player).catch(e=>{});
            }
            return true;
        }
    }

    async fetchPlayer() {
        this.roundControl++;
        let player = this.alivePlayers[rn({
            min: 0,
            max: this.alivePlayers.length-1,
            integer: true
        })];
        if (this.roundControl >= this.roundUserFetch) {
            let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.round.elimination.title`, {alivePlayersAmount: this.alivePlayers.length, playerTag: `${player.user.username}#${player.user.discriminator}`, playerId: player.id}))
                .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                .setDescription(this.i18n.__(`command.russianroulette.round.elimination.description`, {alivePlayersAmount: this.alivePlayers.length, playerTag: `${player.user.username}#${player.user.discriminator}`, playerId: player.id}));
            await this.roundMessageAction({embeds: [embed], components: (typeof this.buttonSets[this.status] != undefined) ? [this.buttonSets[this.status]] : []});
            this.alivePlayers = this.alivePlayers.filter(function(p) { return p.id !== player.id });
            await sleep(this.roundTimer / this.roundUserFetch);
            return player;
        }
        let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.round.title`, {alivePlayersAmount: this.alivePlayers.length, playerTag: `${player.user.username}#${player.user.discriminator}`, playerId: player.id}))
            .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
            .setDescription(this.i18n.__(`command.russianroulette.round.description`, {alivePlayersAmount: this.alivePlayers.length, playerTag: `${player.user.username}#${player.user.discriminator}`, playerId: player.id}));
        await this.roundMessageAction({embeds: [embed], components: (typeof this.buttonSets[this.status] != undefined) ? [this.buttonSets[this.status]] : []});
        await sleep(this.roundTimer / this.roundUserFetch);
        if (this.cleared)return true;
        return this.fetchPlayer();
    }

    async roundMessageAction(...args) {
        if (this.roundMessage)return this.roundMessage.edit(...args);
        this.roundMessage = await this.CommandExecution.sendRaw(...args);
        return this.roundMessage;
    }

    async cancel(reason = "default") {
        this.status = "canceled";
        let embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.cancel.${reason}.title`))
                                        .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.error'))
                                        .setDescription(this.i18n.__(`command.russianroulette.cancel.${reason}.description`));
    
        await this.CommandExecution.sendRaw({embeds: [embed]})

        embed = new MessageEmbed().setTitle(this.i18n.__(`command.russianroulette.${this.status}.title`))
                                        .setColor(this.CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                                        .setDescription(this.i18n.__(`command.russianroulette.${this.status}.description`));

        this.startMessage.edit({embeds: [embed]}).catch(e=>{console.log(e)});
        this.clear();
        return true;
    }

    async clear() {
        if (this.cleared)return true;
        this.cleared = true;
        delete this.CommandExecution.Guild.data.russianroulette.channels[this.CommandExecution.Channel.id];
        return true;
    }

    async joinByInteraction(interaction) {
        if (this.status == "playing")return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.joinCurrentlyPlaying'),
            ephemeral: true
        });
        let User = await this.CommandExecution.Guild.getMemberById(interaction.user.id);
        if (!(await this.CommandExecution.CommandManager.userHasPermissionPerContext(this.CommandExecution, User, this.subPermissions.join)))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.joinDenied'),
            ephemeral: true
        });
        if (this.players.map(p => p.id).includes(User.id))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.alreadyJoined'),
            ephemeral: true
        });
        this.players.push(User);
        return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.joined'),
            ephemeral: true
        });
    }

    async leaveByInteraction(interaction) {
        if (this.status == "playing")return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.leaveCurrentlyPlaying'),
            ephemeral: true
        });
        let User = await this.CommandExecution.Guild.getMemberById(interaction.user.id);
        if (!(await this.CommandExecution.CommandManager.userHasPermissionPerContext(this.CommandExecution, User, this.subPermissions.leave)))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.leaveDenied'),
            ephemeral: true
        });
        if (!this.players.map(p => p.id).includes(User.id))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.notJoined'),
            ephemeral: true
        });
        this.players = this.players.filter(function(p) { return p.id !== User.id });
        return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.left'),
            ephemeral: true
        });
    }

    async cancelByInteraction(interaction) {
        if (this.status == "playing")return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.cancelCurrentlyPlaying'),
            ephemeral: true
        });
        if (!(await this.CommandExecution.CommandManager.userHasPermissionPerContext(this.CommandExecution, await this.CommandExecution.Guild.getMemberById(interaction.user.id), this.subPermissions.cancel)))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.canceledDenied'),
            ephemeral: true
        });
        this.cancel('interaction');
        return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.canceled'),
            ephemeral: true
        });
    }

    async stopByInteraction(interaction) {
        if (!(await this.CommandExecution.CommandManager.userHasPermissionPerContext(this.CommandExecution, await this.CommandExecution.Guild.getMemberById(interaction.user.id), this.subPermissions.stop)))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.stopDenied'),
            ephemeral: true
        });
        this.cancel('stopped');
        return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.stop'),
            ephemeral: true
        });
    }

    async amIAliveByInteraction(interaction) {
        if (this.status != "playing")return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.notCurrentlyPlaying'),
            ephemeral: true
        });
        let User = await this.CommandExecution.Guild.getMemberById(interaction.user.id);
        if (!this.players.map(p => p.id).includes(User.id))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.notJoined'),
            ephemeral: true
        });
        if (this.alivePlayers.map(p => p.id).includes(User.id))return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.alive.alive'),
            ephemeral: true
        });
        return interaction.reply({
            content: this.i18n.__('interaction.russianroulette.alive.eliminated'),
            ephemeral: true
        });
    }

    async getPrize(prizeName) {
        switch (prizeName) {
            case "muted1min":
                return {
                    display: `Muted One Minute`,
                    key: `muted1min`,
                    run: async (RussianRoulette, user) => {
                        let isUserAlreadyMuted = await RussianRoulette.CommandExecution.Guild.ModerationManager.isUserPunished(user.id, 'Mute');
                        if (isUserAlreadyMuted) return RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute.alreadymuted`, {userId: user.id}));
                        //await RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute`, {userTag: User.user.tag , muteDuration: `one minute `}));
                        let Punished = await RussianRoulette.CommandExecution.Guild.getUserFromArg(user.id);
                        return RussianRoulette.CommandExecution.Guild.ModerationManager.muteUser(RussianRoulette.CommandExecution, Punished, this.i18n.__(`command.russianroulette.prize.mute.reason`), 1*60);
                    }
                }
                break;

            case "muted5min":
                return {
                    display: `Muted Five Minutes`,
                    key: `muted5min`,
                    run: async (RussianRoulette, user) => {
                        let isUserAlreadyMuted = await RussianRoulette.CommandExecution.Guild.ModerationManager.isUserPunished(user.id, 'Mute');
                        if (isUserAlreadyMuted) return RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute.alreadymuted`, {userId: user.id}));
                        //await RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute`, {userTag: User.user.tag , muteDuration: `five minutes `}));
                        let Punished = await RussianRoulette.CommandExecution.Guild.getUserFromArg(user.id);
                        return RussianRoulette.CommandExecution.Guild.ModerationManager.muteUser(RussianRoulette.CommandExecution, Punished, this.i18n.__(`command.russianroulette.prize.mute.reason`), 5*60);
                    }
                }
                break;

            case "muted10min":
                return {
                    display: `Muted Ten Minutes`,
                    key: `muted10min`,
                    run: async (RussianRoulette, user) => {
                        let isUserAlreadyMuted = await RussianRoulette.CommandExecution.Guild.ModerationManager.isUserPunished(user.id, 'Mute');
                        if (isUserAlreadyMuted) return RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute.alreadymuted`, {userId: user.id}));
                        //await RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute`, {userTag: User.user.tag , muteDuration: `ten minutes `}));
                        let Punished = await RussianRoulette.CommandExecution.Guild.getUserFromArg(user.id);
                        return RussianRoulette.CommandExecution.Guild.ModerationManager.muteUser(RussianRoulette.CommandExecution, Punished, this.i18n.__(`command.russianroulette.prize.mute.reason`), 10*60);
                    }
                }
                break;

            case "muted30min":
                return {
                    display: `Muted Ten Minutes`,
                    key: `muted30min`,
                    run: async (RussianRoulette, user) => {
                        let isUserAlreadyMuted = await RussianRoulette.CommandExecution.Guild.ModerationManager.isUserPunished(user.id, 'Mute');
                        if (isUserAlreadyMuted) return RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute.alreadymuted`, {userId: user.id}));
                        //await RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute`, {userTag: User.user.tag , muteDuration: `30 minutes `}));
                        let Punished = await RussianRoulette.CommandExecution.Guild.getUserFromArg(user.id);
                        return RussianRoulette.CommandExecution.Guild.ModerationManager.muteUser(RussianRoulette.CommandExecution, Punished, this.i18n.__(`command.russianroulette.prize.mute.reason`), 30*60);
                    }
                }
                break;

            case "muted1h":
                return {
                    display: `Muted One Hour`,
                    key: `muted1h`,
                    run: async (RussianRoulette, user) => {
                        let isUserAlreadyMuted = await RussianRoulette.CommandExecution.Guild.ModerationManager.isUserPunished(user.id, 'Mute');
                        if (isUserAlreadyMuted) return RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute.alreadymuted`, {userId: user.id}));
                        //await RussianRoulette.CommandExecution.sendMainEmbed(this.i18n.__(`command.russianroulette.prize.mute`, {userTag: User.user.tag , muteDuration: `one hour `}));
                        let Punished = await RussianRoulette.CommandExecution.Guild.getUserFromArg(user.id);
                        return RussianRoulette.CommandExecution.Guild.ModerationManager.muteUser(RussianRoulette.CommandExecution, Punished, this.i18n.__(`command.russianroulette.prize.mute.reason`), 60*60);
                    }
                }
                break;
        
            default:
                return undefined;
                break;
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }