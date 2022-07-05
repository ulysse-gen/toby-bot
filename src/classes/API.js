/////////////////////////////////
//TobyBot, what else do you want ?
/////////////////////////////////

//Importing NodeJS Modules
const mysql = require(`mysql`);
const _ = require(`lodash`);
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

//Importing classes
const FileLogger = require('./FileLogger');

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

const APIRoutesV1 = require('../../API/v1/routes/index');

module.exports = class API {
    constructor(TobyBot) {
        this.TobyBot = TobyBot;

        this.i18n = TobyBot.i18n;
        this.secret = this.TobyBot.TopConfigurationManager.get('API.secret');
    }

    async initialize(){
        this.app = express();
        this.app.use(cors({
            exposedHeaders: ['Authorization'],
            origin: '*'
        }));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());

        this.app.use('/v1', APIRoutesV1(this));

        this.app.use(function(req, res, next) {
            res.status(404).json({name: 'TobyBot', version: '1.0', status: 404, message: 'not_found'});
        });        

        return this.start();
    }

    async start() {
        return this.app.listen(this.TobyBot.TopConfigurationManager.get('API.port'), () => {
            MainLog.log(this.i18n.__('bot.api.started', {port: this.TobyBot.TopConfigurationManager.get('API.port')}));
        });
    }
}