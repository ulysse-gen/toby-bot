const express = require('express');
const router = express.Router();

const service = require('../services/user');
const security = require('../middlewares/security');

router.get('/', async (req, res) => {
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.any.defaultMessage')
    });
});

router.get('/me', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), service.getMine, security.sameOrPermission(), service.getUserById);
router.get('/me/configuration', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), service.getMine, security.sameOrPermission(), service.getUserConfiguration);
router.get('/me/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), service.getMine, security.sameOrPermission(), service.getUserConfigurationKey);
router.patch('/me/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), service.getMine, security.sameOrPermission(), service.patchConfigurationKey);

router.get('/:userId', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.sameOrPermission(), service.getUserById);
router.get('/:userId/configuration/', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.sameOrPermission(), service.getUserConfiguration);
router.get('/:userId/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.sameOrPermission(), service.getUserConfigurationKey);
router.patch('/:userId/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.sameOrPermission(), service.patchConfigurationKey);

router.post('/gentoken', service.genToken);

router.post('/auth', service.auth);

router.post('/authByDiscordToken', service.authByDiscordToken);

router.post('/authAs', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.authAs);

router.get('/authByTempToken/:userId/:tempToken', security.checkTempToken,  service.authByTempToken);

module.exports = router;
