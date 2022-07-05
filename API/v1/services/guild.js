const bcrypt   = require('bcryptjs');
const jwt    = require('jsonwebtoken');


exports.listAll = async (API, req, res, next) => {
    try {
        let RequestUser = req.decoded.User
        if (RequestUser.permissionLevel < 8)return res.status(403).json('no_permission');
        let guilds = Object.entries(API.TobyBot.GuildManager.guilds).map(indGuild => indGuild[1].apiVersion());
        return res.status(200).json(guilds);
    } catch (error) {
        console.log(error)
        return res.status(501).json('error');
    }
}


exports.getById = async (API, req, res, next) => {
    const { id } = req.params;

    try {
        let RequestUser = req.decoded.User
        if (RequestUser.permissionLevel < 8)return res.status(403).json('no_permission');
        let Guild = await API.TobyBot.GuildManager.getGuildById(id);

        if (Guild) {
            Guild = Guild.apiVersion();
            return res.status(200).json(Guild);
        }else {
            return res.status(404).json('guild_not_found');
        }
    } catch (error) {
        return res.status(501).json('error');
    }
}