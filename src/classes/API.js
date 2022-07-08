/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const colors = require('colors');
const { I18n } = require('i18n');

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

const APIRoutesV1 = require('../../API/v1/routes/index');

module.exports = class API {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.i18n = new I18n({
            locales: ['en-US','fr-FR'],
            directory: 'locales/API',
            fallbackLocale: 'en-US',
            defaultLocale: 'en-US',
        });

        this.version = TobyBot.PackageInformations.apiVersion;
        this.UserManager = TobyBot.UserManager;
        this.GuildManager = TobyBot.GuildManager;

        this.secret = this.TobyBot.TopConfigurationManager.get('API.secret');
    }

    async initialize(){
        this.app = express();

        this.app.use(this.i18n.init);
        this.app.use((req, res, next) => {
            req.API = this;
            next();
        });
        this.app.use(cors({
            exposedHeaders: ['Authorization'],
            origin: '*'
        }));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());

        this.app.use('/v1', APIRoutesV1);

        this.app.use(function(req, res, next) {
            res.status(404).json({name: req.__('namee'), version: req.API.version, status: 404, message: req.__('route.unknown')});
        });        

        this.server = await this.start();
        return true;
    }

    async reInitialize() {
        await this.stop();
        delete this.app;
        delete this.server;
        return this.initialize();
    }

    async start() {
        return this.app.listen(this.TobyBot.TopConfigurationManager.get('API.port'), () => {
            MainLog.log(this.TobyBot.i18n.__('bot.api.started', {port: this.TobyBot.TopConfigurationManager.get('API.port').toString().green}));
        });
    }

    async stop() {
        return new Promise((res, rej) => {
            this.server.close(() => {
                MainLog.log(this.TobyBot.i18n.__('bot.api.stopped'));
                res(true);
            });
        })
    }
}