const express = require('express');
const router = express.Router();

const service = require('../services/command');
const security = require('../middlewares/security');

router.get('/', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.listAll(router.API, ...args));

router.get('/:name', (...args)=>service.getByName(router.API, ...args));

router.post('/execute', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.execute(router.API, ...args));

module.exports = (API) => {
    router.API = API;
    return router;
};
