const express = require('express');
const router = express.Router();

const service = require('../services/configuration');
const security = require('../middlewares/security');

const documentationController = require('./configurationDocumentation');

module.exports = (API) => {
    router.API = API;
    router.use('/documentation', documentationController(router.API));
    return router;
};
