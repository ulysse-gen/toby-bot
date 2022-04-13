const colors = require(`colors`);
const express = require(`express`);
const app = express()

const authorizationToken = "Et$9kT!mFfXkts9kiLspkNNb6fjt$d83H3BL73R9";

//Import needs from index
const {
    configuration,
    client,
    MainLog,
    globalGuilds,
    botLifeMetric
} = require(`../../index`);

module.exports = async function () {
    botLifeMetric.addEntry("apiStartup");
    app.get('/discord/users/:userId', async (req, res) => {
        if (typeof req.headers.authorization == "undefined" || req.headers.authorization != authorizationToken) {
            res.status(403).json({
                code: 403,
                text: `Forbidden`
            });
            return false;
        }
        let user = await client.users.fetch(req.params.userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined
        });
        if (typeof user == "undefined") {
            res.status(404).json({
                code: 404,
                text: `Not Found`
            });
            return false;
        }
        res.status(200).json(user);
    });

    app.get('/discord/guilds/:guildId', async (req, res) => {
        if (typeof req.headers.authorization == "undefined" || req.headers.authorization != authorizationToken) {
            res.status(403).json({
                code: 403,
                text: `Forbidden`
            });
            return false;
        }
        let guild = await client.guilds.fetch(req.params.guildId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined
        });
        if (typeof guild == "undefined") {
            res.status(404).json({
                code: 404,
                text: `Not Found`
            });
            return false;
        }
        res.status(200).json(guild);
    });

    app.get('/discord/guilds/:guildId/members/:userId', async (req, res) => {
        if (typeof req.headers.authorization == "undefined" || req.headers.authorization != authorizationToken) {
            res.status(403).json({
                code: 403,
                text: `Forbidden`
            });
            return false;
        }
        let member = await client.guilds.fetch(req.params.guildId, {
            cache: false,
            force: true
        }).then(guild => guild.members.fetch(req.params.userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined
        })).catch(e => {
            return undefined
        });
        if (typeof member == "undefined") {
            res.status(404).json({
                code: 404,
                text: `Not Found`
            });
            return false;
        }
        res.status(200).json(member);
    });

    app.get('/canManageServer/:guildId/:userId', async (req, res) => {
        if (typeof req.headers.authorization == "undefined" || req.headers.authorization != authorizationToken) {
            res.status(403).json({
                code: 403,
                text: `Forbidden`
            });
            return false;
        }
        let member = await client.guilds.fetch(req.params.guildId, {
            cache: false,
            force: true
        }).then(guild => guild.members.fetch(req.params.userId, {
            cache: false,
            force: true
        }).catch(e => {
            return undefined
        })).catch(e => {
            return undefined
        });
        if (typeof member == "undefined") {
            res.status(200).json(false);
            return false;
        }

        let userRoles = [];
        let userPermissions = [];
        let memberRoles = member.roles.cache;
        memberRoles.sort((a, b) => b.rawPosition - a.rawPosition)
        memberRoles.forEach(memberRole => {
            if (memberRole.name != "@everyone") userRoles.push(memberRole.id);
            let perms = memberRole.permissions.serialize(false);
            for (const permission in perms) {
                if (perms[permission] == true)
                    if (!userPermissions.includes(permission)) userPermissions.push(permission);
            }
        });
        if (userPermissions.includes(`MANAGE_GUILD`)) {
            res.status(200).json(true);
            return true;
        }
        res.status(200).json(false);
        return false;
    });

    app.get('/guilds/:guildId/configuration', async (req, res) => {
        if (typeof req.headers.authorization == "undefined" || req.headers.authorization != authorizationToken) {
            res.status(403).json({
                code: 403,
                text: `Forbidden`
            });
            return false;
        }
        let guild = await globalGuilds.getGuild({
            id: req.params.guildId
        });
        if (typeof guild == "undefined") {
            res.status(404).json({
                code: 404,
                text: `Not Found`
            });
            return false;
        }
        res.status(200).json(guild.configuration);
        return false;
    });

    app.get('/guilds/:guildId/permissions', async (req, res) => {
        if (typeof req.headers.authorization == "undefined" || req.headers.authorization != authorizationToken) {
            res.status(403).json({
                code: 403,
                text: `Forbidden`
            });
            return false;
        }
        let guild = await globalGuilds.getGuild({
            id: req.params.guildId
        });
        if (typeof guild == "undefined") {
            res.status(404).json({
                code: 404,
                text: `Not Found`
            });
            return false;
        }
        res.status(200).json(guild.permissions);
        return false;
    });

    app.listen(20000, () => {
        botLifeMetric.addEntry("apiStarted");
        MainLog.log(`API Ready.`)
    })
}