const express = require('express');
const router = express.Router();

const service = require('/app/src/API/v1/services/command.js');
const security = require('/app/src/API/v1/middlewares/security');

router.get('/', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), service.listAll);

router.get('/:commandName', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), service.getByName);

router.post('/:commandName/execute', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.execute);

module.exports = router;
