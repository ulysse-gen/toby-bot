const express = require('express');
const router = express.Router();

const service = require('../services/guild');
const security = require('../middlewares/security');

router.get('/', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.listAll(router.API, ...args));

router.get('/:id', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.getById(router.API, ...args));

module.exports = (API) => {
    router.API = API;
    return router;
};
