import axios from 'axios';

import AutoModerationRun from './AutoModerationRun';
import TobyBot from './TobyBot';
import { Message } from 'discord.js';

export default class AutoModeration {
    TobyBot: TobyBot;
    scamLinks: string[];
    scamTerms: string[];
    scamSlashes: string[];
    domainNames: string[];
    constructor(TobyBot: TobyBot) {
        this.TobyBot = TobyBot;

        this.scamLinks = [];
        this.scamTerms = [];
        this.scamSlashes = [];
        this.domainNames = [];

        this.refreshDataSets();
        setInterval(() => this.refreshDataSets(), 21600000); //Update DataSets every 6 hours
    }

    async examine(message: Message) {
        return new AutoModerationRun(this, message).run();
    }
    
    async hasPermission(AutoModerationRun: AutoModerationRun, permission) {
        let globalPermissions = await this.TobyBot.PermissionManager.userHasPermission(permission, AutoModerationRun.User, AutoModerationRun.Channel);
        let guildPermissions = await AutoModerationRun.Guild.PermissionManager.userHasPermission(permission, AutoModerationRun.User, AutoModerationRun.Channel, true);
        return (globalPermissions) ? true : guildPermissions;
    }

    async refreshDataSets() {
        this.scamLinks = await axios.get('https://spen.tk/api/v1/links')
            .then(response => {
                return response.data.links
            })
            .catch(_error => {
                return [];
            });
        this.scamTerms = await axios.get('https://spen.tk/api/v1/terms')
            .then(response => {
                return response.data.terms
            })
            .catch(_error => {
                return [];
            });
        this.scamSlashes = await axios.get('https://spen.tk/api/v1/slashes')
            .then(response => {
                return response.data.slashes
            })
            .catch(_error => {
                return [];
            });
        this.domainNames = await axios.get('https://data.iana.org/TLD/tlds-alpha-by-domain.txt')
            .then(response => {
                return response.data.split('\n');
            })
            .catch(_error => {
                return [];
            });
        //console.log(`Loaded AutoMod datasets.`);
    }
}