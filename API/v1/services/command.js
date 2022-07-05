const bcrypt   = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const CommandExecution = require('../../../src/classes/CommandExecution');


exports.listAll = async (API, req, res, next) => {
    try {
        let RequestUser = req.decoded.User
        if (RequestUser.permissionLevel < 8)return res.status(403).json('no_permission');
        let commands = API.TobyBot.CommandManager.commands.map(indCommand => indCommand.apiVersion());
        return res.status(200).json(commands);
    } catch (error) {
        return res.status(501).json('error');
    }
}


exports.getByName = async (API, req, res, next) => {
    const { name } = req.params;

    try {
        let Command = await API.TobyBot.CommandManager.fetch(name);
        Command = Command.apiVersion();

        if (Command) {
            return res.status(200).json(Command);
        }else {
            return res.status(404).json('command_not_found');
        }
    } catch (error) {
        return res.status(501).json('error');
    }
}

exports.execute = async (API, req, res, next) => {
    const { name, options, guild, channel } = req.body;

    try {
        let RequestUser = req.decoded.User;
        if (RequestUser.permissionLevel < 9)return res.status(403).json('no_permission');
        if (typeof name == "undefined")return res.status(401).json('missing_name');
        if (typeof guild == "undefined")return res.status(401).json('missing_guild');
        if (typeof channel == "undefined")return res.status(401).json('missing_channel');

        let Command = await API.TobyBot.CommandManager.fetch(name);
        let Guild = await API.TobyBot.GuildManager.getGuildById(guild);
        let Channel = await Guild.getChannelById(channel);
        let User = await Guild.getMemberById(RequestUser.id);
        let commandOptions = ((typeof options != "undefined") ? options : '').replace(/\s+/g, ' ').trim().split(' ');

        if (Command && Guild && Channel) {
            let Trigger = await Channel.send(Guild.ConfigurationManager.get('prefix') + Command.name + ' ' + commandOptions.join(' ')).then(message => {
                message.TobyBot = {
                    TobyBot: API.TobyBot,
                    guild: Guild,
                    user: User
                };
                message.author = User.user;
                return message;
            }).catch(e => {
                return res.status(401).json('could_not_initiate');
            })

            let execution = await new CommandExecution(Trigger, Command, commandOptions, API.TobyBot.CommandManager).execute().catch(e=>{throw e});
            return res.status(401).json(execution);
        }else {
            return res.status(401).json('could_not_build_context');
        }
    } catch (error) {
        console.log(error)
        return res.status(501).json('error');
    }
}