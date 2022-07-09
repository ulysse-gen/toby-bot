const CommandExecution = require('../../../classes/CommandExecution');


exports.listAll = async (req, res, next) => {
    try {
        return res.status(200).json(req.API.TobyBot.CommandManager.commands.map(indCommand => indCommand.apiVersion()));
    } catch (error) {
        return res.status(501).json(req.__('error.unknown'));
    }
}


exports.getByName = async (req, res, next) => {
    const { commandName } = req.params;

    if (!commandName)return res.status(401).json(req.__('error.required', {required: 'commandName'}));

    try {
        let Command = await req.API.TobyBot.CommandManager.fetch(commandName);
        Command = Command;

        if (Command) {
            return res.status(200).json(Command.apiVersion());
        }else {
            return res.status(404).json(req.__('error.command_not_found'));
        }
    } catch (error) {
        return res.status(501).json(req.__('error.unknown'));
    }
}

exports.execute = async (req, res, next) => {
    const { commandName } = req.params;
    const { guildId, channelId, options } = req.body;

    if (!commandName)return res.status(401).json(req.__('error.required', {required: 'commandName'}));
    if (!guildId)return res.status(401).json(req.__('error.required', {required: 'guildId'}));
    if (!channelId)return res.status(401).json(req.__('error.required', {required: 'channelId'}));

    try {
        let Command = await req.API.TobyBot.CommandManager.fetch(commandName);
        if (!Command)return res.status(404).json(req.__('error.command_not_found'));

        let Guild = await req.API.TobyBot.GuildManager.getGuildById(guildId);
        if (!Guild)return res.status(404).json(req.__('error.guild_not_found'));

        let Channel = await Guild.getChannelById(channelId);
        if (!Channel)return res.status(404).json(req.__('error.channel_not_found'));

        let User = req.User;
        let commandOptions = ((typeof options != "undefined") ? options : '').replace(/\s+/g, ' ').trim().split(' ');


        let FakeTrigger = await Channel.send(Guild.ConfigurationManager.get('prefix') + Command.name + ' ' + commandOptions.join(' ')).then(message => {
            message.TobyBot = {
                TobyBot: req.API.TobyBot,
                guild: Guild,
                user: User
            };
            message.author = User.user;
            return message;
        }).catch(e => {
            return res.status(501).json(req.__('error.commands.cannot_initiate'));
        })

        let CommandExecutionObject = new CommandExecution(FakeTrigger, Command, commandOptions, req.API.TobyBot.CommandManager);
        await CommandExecutionObject.buildContext();
        if (typeof CommandExecutionObject.options.permissionDenied != "undefined"){
            CommandExecutionObject.denyPermission(CommandExecutionObject.options.permissionDenied);
            return res.status(501).json(req.__('error.commands.permission_denied'));
        }
        await CommandExecutionObject.logExecution();
        CommandExecutionObject.deferIfNeeded();
        let CommandExecutionProcess = await CommandExecutionObject.Command.execute(CommandExecutionObject);

        return res.status(401).json(CommandExecutionProcess);
    } catch (error) {
        console.log(error)
        return res.status(501).json(req.__('error.unknown'));
    }
}