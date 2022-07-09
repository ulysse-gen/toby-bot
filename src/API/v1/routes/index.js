var express = require('express');
var router = express.Router();

//Import other routes
const userController = require('./user');
const guildController = require('./guild');
const commandController = require('./command');
const systemController = require('./system');

router.get('/', async (req, res) => {
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.defaultMessage')
    });
});

router.get('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on GET/interaction`);
});

router.post('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on POST/interaction`);
});

router.put('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on PUT/interaction`);
});

router.patch('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on PATCH/interaction`);
});

router.delete('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on DELETE/interaction`);
});

router.use('/users', userController);
router.use('/guilds', guildController);
router.use('/commands', commandController);
router.use('/system', systemController);

module.exports = router;
