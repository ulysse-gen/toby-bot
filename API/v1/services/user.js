const bcrypt   = require('bcryptjs');
const jwt    = require('jsonwebtoken');

exports.listAll = async (API, req, res, next) => {
    try {
        let RequestUser = req.decoded.User
        if (RequestUser.permissionLevel < 8)return res.status(403).json('no_permission');
        let users = Object.entries(API.TobyBot.UserManager.users).map(indUser => indUser[1].apiVersion());
        return res.status(200).json(users);
    } catch (error) {
        return res.status(501).json('error');
    }
}

exports.getById = async (API, req, res, next) => {
    const { id } = req.params;

    try {
        let User = await API.TobyBot.UserManager.getUserById(id);
        let RequestUser = req.decoded.User

        if (User) {
            User = User.apiVersion();
            let isSameUser = await API.TobyBot.UserManager.isSameUser(RequestUser, User);
            if (!isSameUser && RequestUser.permissionLevel < 8)return res.status(403).json('no_permission');
            return res.status(200).json(User);
        }else {
            return res.status(404).json('user_not_found');
        }
    } catch (error) {
        return res.status(501).json('error');
    }
}

exports.auth = async (API, req, res, next) => {
    const { id, authToken } = req.body;

    try {
        let User = await API.TobyBot.UserManager.getUserById(id);

        if (User) {
            bcrypt.compare(authToken, User.authToken, function(err, response) {
                if (err) {
                    throw new Error(err);
                }
                if (response) {
                    User = User.apiVersion();

                    const expireIn = 24 * 60 * 60;
                    const token    = jwt.sign({
                        User: User
                    },
                    API.secret,
                    {
                        expiresIn: expireIn
                    });

                    res.header('Authorization', 'Bearer ' + token);

                    return res.status(200).json(User);
                }

                return res.status(403).json('wrong_credentials');
            });
        } else {
            return res.status(404).json('user_not_found');
        }
    } catch (error) {
        return res.status(501).json('error');
    }
}

exports.genPassword = async (API, req, res, next) => {
    const { password } = req.body;

    try {
        res.status(200).json(bcrypt.hashSync(password, 10));
    } catch (error) {
        return res.status(501).json('error');
    }
}