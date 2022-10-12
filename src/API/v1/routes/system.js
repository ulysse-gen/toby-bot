const express = require('express');
const router = express.Router();

const service = require('/app/src/API/v1/services/system');
const security = require('/app/src/API/v1/middlewares/security');

router.get('/status', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.status);

router.get('/status/detailed', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.statusDetailed);

router.get('/uptime', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.uptime);

router.get('/configuration', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.getConfiguration);
router.get('/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.getConfigurationKey);
router.patch('/configuration/:configurationKey', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), service.patchConfigurationKey);


router.get('/haspermission/USER', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.USER), (req, res)=>res.status(200).json(true));
router.get('/haspermission/MOD', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.MOD), (req, res)=>res.status(200).json(true));
router.get('/haspermission/ADMIN', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.ADMIN), (req, res)=>res.status(200).json(true));
router.get('/haspermission/DEV', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.DEV), (req, res)=>res.status(200).json(true));
router.get('/haspermission/SYSTEM', security.checkJWT, security.requirePermissionLevel(security.PermissionLevel.SYSTEM), (req, res)=>res.status(200).json(true));

module.exports = router;
