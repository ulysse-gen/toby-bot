var express = require('express');
var router = express.Router();

const userController = require('./user');
const guildController = require('./guild');
const infosController = require('./infos');
const commandController = require('./command');
const configurationController = require('./configuration');

router.get('/', async (req, res) => {
    res.status(200).json({
        name   : 'TobyBot', 
        version: '1.0', 
        status : 200, 
        message: 'Hello world.'
    });
});

module.exports = (API) => {
    router.API = API;
    router.use('/users', userController(router.API));
    router.use('/guilds', guildController(router.API));
    router.use('/infos', infosController(router.API));
    router.use('/commands', commandController(router.API));
    router.use('/configuration', configurationController(router.API));
    return router;
};
