const express = require('express');
const router = express.Router();

const service = require('../services/documentation');
const security = require('../middlewares/security');

router.get('/configuration/guild', service.guildConfiguration);
router.get('/configuration/user', service.userConfiguration);
router.get('/configuration/system', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.globalConfiguration);

module.exports = router;
