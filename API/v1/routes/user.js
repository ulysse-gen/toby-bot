const express = require('express');
const router = express.Router();

const service = require('../services/user');
const security = require('../middlewares/security');

router.get('/', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.listAll(router.API, ...args));

router.get('/:id', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.getById(router.API, ...args));

router.post('/auth', (...args)=>service.auth(router.API, ...args));

router.post('/genpassword', (...args)=>service.genPassword(router.API, ...args));

module.exports = (API) => {
    router.API = API;
    return router;
};
