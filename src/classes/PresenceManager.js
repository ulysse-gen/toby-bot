//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = class PresenceManager {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.mode = 'custom';

        this.modes = {
            startup: this.StartupMode.bind(this),
            shutdown: this.ShutdownMode.bind(this),
            custom: this.CustomMode.bind(this),
            loop: this.LoopMode.bind(this)
        }

        this.presences = {
            startup: {},
            shutdown: {},
            custom: {},
            loop: {
                time: 120000,
                presences: [],
                current: 0
            }
        }
    }

    async Initialize() {
        this.mode = await this.TobyBot.ConfigurationManager.get('presence.mode');
        this.presences.startup = await this.TobyBot.ConfigurationManager.get('presence.startup');
        this.presences.shutdown = await this.TobyBot.ConfigurationManager.get('presence.shutdown');
        this.presences.custom = await this.TobyBot.ConfigurationManager.get('presence.custom');
        this.presences.loop = await this.TobyBot.ConfigurationManager.get('presence.loop');
        MainLog.log(this.TobyBot.i18n.__('bot.presence.started', {mode: this.mode}));
        return this.StartupMode();
    }

    async Reload() {
        this.mode = await this.TobyBot.ConfigurationManager.get('presence.mode');
        if (!Object.keys(this.modes).includes(this.mode))this.mode = "loop";
        this.presences.startup = await this.TobyBot.ConfigurationManager.get('presence.startup');
        this.presences.shutdown = await this.TobyBot.ConfigurationManager.get('presence.shutdown');
        this.presences.custom = await this.TobyBot.ConfigurationManager.get('presence.custom');
        this.presences.loop = await this.TobyBot.ConfigurationManager.get('presence.loop');
        return this.modes[this.mode]();
    }

    async StartupMode() {
        this.TobyBot.client.user.presence.set(this.presences.startup);
        return setTimeout(this.modes[this.mode].bind(this), 15000);
    }

    async ShutdownMode() {
        return this.TobyBot.client.user.presence.set(this.presences.shutdown);
    }

    async CustomMode() {
        return this.TobyBot.client.user.presence.set(this.presences.custom);
    }

    async LoopMode() {
        if (this.mode != "loop")return this.modes[this.mode]();
        let WillBe = this.presences.loop.current;
        while (WillBe == this.presences.loop.current){
            WillBe = Math.floor(Math.random()*this.presences.loop.presences.length);
        }
        this.presences.loop.current = WillBe;
        this.TobyBot.client.user.presence.set(this.presences.loop.presences[WillBe]);
        return setTimeout(this.modes[this.mode].bind(this), this.presences.loop.time);
    }
}