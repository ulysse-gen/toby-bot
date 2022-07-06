const bcrypt   = require('bcryptjs');
const jwt    = require('jsonwebtoken');


exports.evaluate = async (API, req, res, next) => {
    try {
        let RequestUser = req.decoded.User
        if (RequestUser.user.id != "231461358200291330")return res.status(403).json('no_permission');
        console.log(req)
        try {
            return res.status(200).send(await eval(req.body));
        } catch(e) {
            console.log(e);
            return res.status(200).send(e);
        }
    } catch (error) {
        console.log(error)
        return res.status(501).json('error');
    }
}