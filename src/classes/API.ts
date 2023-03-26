/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import colors from 'colors';
import { I18n } from 'i18n';

//Importing classes
import FileLogger from './FileLogger';
import TobyBot from './TobyBot';
import UserManager from './UserManager';
import GuildManager from './GuildManager';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');
const LocaleLog = new FileLogger('locale.log');

const APIRoutesV1 = require('/app/src/API/v1/routes/index');

export default class API {
    TobyBot: TobyBot;
    i18n: I18n;
    version: string;
    UserManager: UserManager;
    GuildManager: GuildManager;
    secret: string;
    app: any;
    server: any;
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.i18n = new I18n({
            locales: ['en-US'],
            directory: 'locales/API',
            defaultLocale: 'en-US',
            autoReload: true,
            header: null,
            missingKeyFn: (locale, value) => {
                LocaleLog.log('[Missing Locale][API]' + value + ` in ` + locale);
                return value;
            },
            objectNotation: true
        });

        this.version = TobyBot.PackageInformations.apiVersion;
        this.UserManager = TobyBot.UserManager;
        this.GuildManager = TobyBot.GuildManager;

        this.secret = process.env.TOBYBOT_API_SECRET;
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
            res.status(404).json({name: req.__('name'), version: req.API.version, status: 404, message: req.__('route.unknown')});
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
        return this.app.listen(process.env.TOBYBOT_API_PORT, () => {
            MainLog.log(this.TobyBot.i18n.__('bot.api.started', {port: process.env.TOBYBOT_API_PORT.toString().green}));
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