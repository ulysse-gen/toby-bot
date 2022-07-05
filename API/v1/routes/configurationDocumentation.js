const express = require('express');
const router = express.Router();

const service = require('../services/configurationDocumentation');
const security = require('../middlewares/security');

router.get('/:type', (...args)=>service.listType(router.API, ...args));
router.get('/:type/:key', (...args)=>service.listKey(router.API, ...args));

module.exports = (API) => {
    router.API = API;
    return router;
};
