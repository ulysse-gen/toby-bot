const colors = require(`colors`);
const express = require(`express`);
const app = express()

const authorizationToken = "Et$9kT!mFfXkts9kiLspkNNb6fjt$d83H3BL73R9";

//Import needs from index
const {
    globalConfiguration,
    client,
    MainLog,
    globalGuilds,
    botLifeMetric
} = require(`../../index`);

module.exports = async function () {
    botLifeMetric.addEntry("apiStartup");

    app.get('/configuration/getKeys', async (req, res) => {
        res.status(200).json(makeConfigEntries(require(`../../configurations/default/configuration.json`), require(`../../configurations/default/documentation.js`)));
    });

    app.get('/configuration/getKeys/:guildId', async (req, res) => {
        res.status(200).json(makeGuildConfigEntries(require(`../../configurations/default/configuration.json`), (await globalGuilds.getGuild({id: req.params.guildId})).configurationManager.configuration, require(`../../configurations/default/documentation.js`)));
    });


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
        res.status(200).json(guild.configurationManager.configuration);
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
        res.status(200).json(guild.permissionsManager.permissions);
        return false;
    });

    app.listen(20000, () => {
        botLifeMetric.addEntry("apiStarted");
        MainLog.log(`API Ready.`)
    })
}



function makeConfigEntries(defaultConfig, documentation, path = []) {
    let configEntries = {};
    for (var entry in defaultConfig) {
        let pathh = JSON.parse(JSON.stringify(path));
        pathh.push(entry)
        try {
            if (defaultConfig[entry].constructor === Object) {
                let configThings = makeConfigEntries(defaultConfig[entry], documentation[entry], pathh)
                for (const key in configThings) {
                    configEntries[key] = configThings[key];
                }
            } else {
                configEntries[pathh.join('.')] = {
                    type: typeof defaultConfig[entry],
                    name: entry,
                    path: pathh,
                    defaultValue: defaultConfig[entry]
                };
                if (typeof documentation[entry] == "object")configEntries[pathh.join('.')].documentation = documentation[entry];
            }
        } catch (e) {
            console.log(`An error occured making the config entries.`);
        }
    }
    return configEntries;
}

function makeGuildConfigEntries(defaultConfig, currentConfig, documentation, path = []) {
    let configEntries = {};
    for (var entry in currentConfig) {
        let pathh = JSON.parse(JSON.stringify(path));
        pathh.push(entry);

        try {
            if (currentConfig[entry].constructor === Object) {
                let configThings = makeGuildConfigEntries(defaultConfig[entry], currentConfig[entry], documentation[entry], pathh)
                for (const key in configThings) {
                    configEntries[key] = configThings[key];
                }
            } else {
                configEntries[pathh.join('.')] = {
                    type: typeof currentConfig[entry],
                    name: entry,
                    path: pathh,
                    value: currentConfig[entry],
                    defaultValue: defaultConfig[entry]
                };
                if (typeof documentation[entry] == "object")configEntries[pathh.join('.')].documentation = documentation[entry];
            }
        } catch (e) {
            console.log(`An error occured making the config entries.`);
        }
    }
    return configEntries;
}