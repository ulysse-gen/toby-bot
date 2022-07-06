const express = require('express');
const router = express.Router();

const service = require('../services/system');
const security = require('../middlewares/security');

router.get('/', (req, res, next)=>{
    let API = router.API;
    try {
        return res.status(404).json('nothing_yet');
    } catch (error) {
        return res.status(501).json('error');
    }
});

router.post('/evaluate', (...args)=>security.checkJWT(router.API, ...args), (...args)=>service.evaluate(router.API, ...args));

module.exports = (API) => {
    router.API = API;
    return router;
};
