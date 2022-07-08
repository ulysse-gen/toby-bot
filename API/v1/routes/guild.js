const express = require('express');
const router = express.Router();

const service = require('../services/guild');
const security = require('../middlewares/security');

router.get('/', async (req, res) => {
    res.status(200).json({
        name   : req.__('name'), 
        version: req.API.version, 
        status : 200, 
        message: req.__('route.v1.any.defaultMessage')
    });
});

router.get('/:guildId', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.needGuildPermission(security.GuildPermissions.MANAGE_GUILD), service.getGuildById);
router.get('/:guildId/configuration/', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.needGuildPermission(security.GuildPermissions.MANAGE_GUILD), service.getGuildConfiguration);
router.get('/:guildId/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.needGuildPermission(security.GuildPermissions.MANAGE_GUILD), service.getGuildConfigurationKey);
router.patch('/:guildId/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), security.needGuildPermission(security.GuildPermissions.MANAGE_GUILD), service.patchGuildConfigurationKey);

module.exports = router;
