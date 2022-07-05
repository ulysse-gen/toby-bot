const express = require('express');
const router = express.Router();

router.get('/', (req, res, next)=>{
    let API = router.API;

    try {
        return res.status(404).json('nothing_yet');
    } catch (error) {
        return res.status(501).json('error');
    }
});

module.exports = (API) => {
    router.API = API;
    return router;
};
