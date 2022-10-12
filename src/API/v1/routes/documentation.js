const express = require('express');
const router = express.Router();

const service = require('/app/src/API/v1/services/documentation');
const security = require('/app/src/API/v1/middlewares/security');

router.get('/configuration/guild', service.guildConfiguration);
router.get('/configuration/user', service.userConfiguration);
router.get('/configuration/system', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.globalConfiguration);

module.exports = router;
