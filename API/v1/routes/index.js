var express = require('express');
var router = express.Router();

//Import other routes
const userController = require('./user');
const guildController = require('./guild');
const commandController = require('./command');
const systemController = require('./system');
const documentationController = require('./documentation');

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
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.defaultMessage')
    });
});

router.post('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on POST/interaction`);
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.defaultMessage')
    });
});

router.put('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on PUT/interaction`);
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.defaultMessage')
    });
});

router.patch('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on PATCH/interaction`);
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.defaultMessage')
    });
});

router.delete('/interactions', (req, res) => {
    console.log(req);
    console.log(`^ Received an interaction on DELETE/interaction`);
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.defaultMessage')
    });
});

router.use('/users', userController);
router.use('/guilds', guildController);
router.use('/commands', commandController);
router.use('/system', systemController);
router.use('/documentation', documentationController);

module.exports = router;
