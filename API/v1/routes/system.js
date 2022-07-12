const express = require('express');
const router = express.Router();

const service = require('../services/system');
const security = require('../middlewares/security');

router.get('/status', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.status);

router.get('/uptime', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.uptime);

router.get('/configuration', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.getConfiguration);
router.get('/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.getConfigurationKey);
router.patch('/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.patchConfigurationKey);

module.exports = router;
