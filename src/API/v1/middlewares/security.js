const jwt = require('jsonwebtoken');
const {Permissions} = require('discord.js');

exports.PermissionLevel = {
    'SYSTEM': 500,
    'DEV': 250,
    'ADMIN': 100,
    'MOD': 50,
    'USER': 10
}

exports.GuildPermissions = Permissions.FLAGS;

exports.checkJWT = async (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (!!token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    if (token) {
        jwt.verify(token, req.API.secret, async (err, decoded) => {
            if (err) {
                return res.status(401).json(req.__('error.token_not_valid'));
            } else {
                req.JWT = decoded;
                req.User = await req.API.TobyBot.UserManager.getUserById(decoded.User.id);

                if (req.User.invalidatedTokens && req.User.invalidatedTokens.includes(decoded.tokenIdentifier))return res.status(401).json(req.__('error.token_not_valid'));

                next();
            }
        });
    } else {
        return res.status(401).json(req.__('error.token_required'));
    }
}

exports.checkTempToken = async (req, res, next) => {
    const { userId, tempToken } = req.params;

    if (!userId)return res.status(401).json(req.__('error.required', {required: 'userId'}));
    if (!tempToken)return res.status(401).json(req.__('error.required', {required: 'tempToken'}));

    if (tempToken) {
        jwt.verify(tempToken, req.API.secret, async (err, decoded) => {
            if (err) {
                return res.status(401).json(req.__('error.token_not_valid'));
            } else {
                req.JWT = decoded;
                req.User = await req.API.TobyBot.UserManager.getUserById(decoded.User.id);
                if (!req.User || !req.User.tempTokenIdentifier || !req.User.tempTokenIdentifier || !decoded.tokenIdentifier || req.User.tempTokenIdentifier != decoded.tokenIdentifier)return res.status(401).json(req.__('error.token_not_valid'));
                delete req.User.tempTokenIdentifier;
                next();
            }
        });
    } else {
        return res.status(401).json(req.__('error.token_required'));
    }
}

exports.requirePermissionLevel = (requiredPermissionLevel) => {
    return async (req, res, next) => {
        let userPermissionLevel = parseInt(req.User.permissionLevel);
        if (userPermissionLevel >= requiredPermissionLevel) {
            return next();
        } else {
            return res.status(403).json(req.__('error.no_permission'));
        }
    };
}

exports.sameOrPermission = (requiredPermissionLevel = this.PermissionLevel.ADMIN) => {
    return async (req, res, next) => {
        let userPermissionLevel = parseInt(req.User.permissionLevel);
        if (!req.params || !req.params.userId)return res.status(401).json(req.__('error.required', {required: 'userId'}));
        let User = await req.API.TobyBot.UserManager.getUserById(req.params.userId);
        if (!User)return res.status(401).json(req.__('error.user_not_found'));
        if (User.id === req.User.id){
            return next();
        }else if (userPermissionLevel >= requiredPermissionLevel) {
            return next();
        } else {
            return res.status(403).json(req.__('error.no_permission'));
        }
    };
}

exports.needGuildPermission = (guildPermission = this.GuildPermissions.MANAGE_GUILD, permissionBypass = this.PermissionLevel.ADMIN) => {
    return async (req, res, next) => {
        const { guildId } = req.params;

        if (!guildId)return res.status(401).json(req.__('error.required', {required: 'guildId'}));

        let userPermissionLevel = parseInt(req.User.permissionLevel);
        if (userPermissionLevel >= permissionBypass) {
            return next();
        }
        let Guild = await req.API.TobyBot.GuildManager.getGuildById(guildId);
        if (!Guild)return res.status(404).json(req.__('error.guild_not_found'));

        let GuildMember = await Guild.getMemberById(req.User.id);
        if (!GuildMember)return res.status(403).json(req.__('error.user_not_in_guild'));
        let hasPermission = GuildMember.permissions.has(guildPermission);

        if (!hasPermission)return res.status(403).json(req.__('error.no_permission'));
        return next();
    };
}