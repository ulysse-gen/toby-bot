const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, EmbedFieldData } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "roleadder",
    aliases: ["ra"],
    permission: "command.roleadder",
    permissions: {
        use: 'command.roleadder.use',
        manageroles: 'command.roleadder.manageroles',
        settings: 'command.roleadder.settings'
    },
    category: "informations",
    enabled: true,
    async execute(CommandExecution) {
        if (!CommandExecution.options.subcommand){
            let fields = [
                [CommandExecution.i18n.__(`command.${this.name}.fields.logaddeduser.title`), CommandExecution.i18n.__(`command.${this.name}.fields.logaddeduser.content`, {enabled: (CommandExecution.Guild.ConfigurationManager.get('roleadder.logAddedUsers')) ? 'on' : 'off'}), true],
                [CommandExecution.i18n.__(`command.${this.name}.fields.reason.title`), CommandExecution.i18n.__(`command.${this.name}.fields.reason.content`, {reason: CommandExecution.Guild.ConfigurationManager.get('roleadder.addReason')}), true],
                [CommandExecution.i18n.__(`command.${this.name}.fields.roles.title`), CommandExecution.i18n.__(`command.${this.name}.fields.roles.content`, {roles: (CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').length != 0) ? `<@&${CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').join('>, <@&')}>` : `None`}), true],
                [CommandExecution.i18n.__(`command.${this.name}.fields.blacklist.title`), CommandExecution.i18n.__(`command.${this.name}.fields.blacklist.content`, {roles: (CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').length != 0) ? `<@&${CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').join('>, <@&')}>` : `None`}), true],
                [CommandExecution.i18n.__(`command.${this.name}.fields.whitelist.title`), CommandExecution.i18n.__(`command.${this.name}.fields.whitelist.content`, {roles: (CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').length != 0) ? `<@&${CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').join('>, <@&')}>` : `None`}), true],
            ];
            if (CommandExecution.Guild.data.roleadder.queue) fields.push(["RoleAdder Pending:", `Users waiting for their role(s): \`${CommandExecution.Guild.data.roleadder.queue.length}\``, false])
            return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.title`), undefined, fields);
        }

        if (CommandExecution.options.subcommand == "logaddedusers") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.settings))CommandExecution.denyPermission(this.permissions.settings);
            if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingValue.title`), CommandExecution.i18n.__(`command.${this.name}.missingValue.description`));
            let Value = (CommandExecution.options.value == 'on' || CommandExecution.options.value == '1' || CommandExecution.options.value == "true" || CommandExecution.options.value == "yes" || CommandExecution.options.value == 1 || CommandExecution.options.value == true) ? true : false;
            await CommandExecution.Guild.ConfigurationManager.set('roleadder.logAddedUsers', Value);
            await CommandExecution.Guild.ConfigurationManager.save();
            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.logaddedusersEmbed.title`));
        }

        if (CommandExecution.options.subcommand == "addrole") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);
            if (!CommandExecution.options.role){
                if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingRole.title`), CommandExecution.i18n.__(`command.${this.name}.missingRole.description`));
                CommandExecution.options.role = CommandExecution.options.value;
            }
            if (CommandExecution.options.role.startsWith('<@&'))CommandExecution.options.role = CommandExecution.options.role.replace('<@&', '').replace('>', '');
            let RoleToAdd = await CommandExecution.Guild.Guild.roles.fetch(CommandExecution.options.role).catch(e => undefined);

            if (!RoleToAdd)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.couldNotAddRole.title`), CommandExecution.i18n.__(`command.${this.name}.couldNotAddRole.description`));
            let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').push(CommandExecution.options.role);
            await CommandExecution.Guild.ConfigurationManager.save();

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.roleAdded.title`));
        }

        if (CommandExecution.options.subcommand == "removerole") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);
            if (!CommandExecution.options.role){
                if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingRole.title`), CommandExecution.i18n.__(`command.${this.name}.missingRole.description`));
                CommandExecution.options.role = CommandExecution.options.value;
            }
            if (CommandExecution.options.role.startsWith('<@&'))CommandExecution.options.role = CommandExecution.options.role.replace('<@&', '').replace('>', '');
            let RoleToRemove = await CommandExecution.Guild.Guild.roles.fetch(CommandExecution.options.role).catch(e => undefined);

            if (!RoleToRemove)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.couldNotRemoveRole.title`), CommandExecution.i18n.__(`command.${this.name}.couldNotRemoveRole.description`));
            let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').filter(role => role != RoleToRemove);
            await CommandExecution.Guild.ConfigurationManager.set('roleadder.rolesToAdd', CurrentRoles);
            await CommandExecution.Guild.ConfigurationManager.save();

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.roleRemoved.title`));
        }

        if (CommandExecution.options.subcommand == "addtoblacklist") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);
            if (!CommandExecution.options.role){
                if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingRole.title`), CommandExecution.i18n.__(`command.${this.name}.missingRole.description`));
                CommandExecution.options.role = CommandExecution.options.value;
            }
            if (CommandExecution.options.role.startsWith('<@&'))CommandExecution.options.role = CommandExecution.options.role.replace('<@&', '').replace('>', '');
            let RoleToAdd = await CommandExecution.Guild.Guild.roles.fetch(CommandExecution.options.role).catch(e => undefined);

            if (!RoleToAdd)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.couldNotAddRole.title`), CommandExecution.i18n.__(`command.${this.name}.couldNotAddRole.description`));
            let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').push(CommandExecution.options.role);
            await CommandExecution.Guild.ConfigurationManager.save();

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.roleAdded.title`));
        }

        if (CommandExecution.options.subcommand == "removefromblacklist") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);
            if (!CommandExecution.options.role){
                if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingRole.title`), CommandExecution.i18n.__(`command.${this.name}.missingRole.description`));
                CommandExecution.options.role = CommandExecution.options.value;
            }
            if (CommandExecution.options.role.startsWith('<@&'))CommandExecution.options.role = CommandExecution.options.role.replace('<@&', '').replace('>', '');
            let RoleToRemove = await CommandExecution.Guild.Guild.roles.fetch(CommandExecution.options.role).catch(e => undefined);

            if (!RoleToRemove)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.couldNotRemoveRole.title`), CommandExecution.i18n.__(`command.${this.name}.couldNotRemoveRole.description`));
            let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').filter(role => role != RoleToRemove);
            await CommandExecution.Guild.ConfigurationManager.set('roleadder.blacklist', CurrentRoles);
            await CommandExecution.Guild.ConfigurationManager.save();

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.roleRemoved.title`));
        }

        if (CommandExecution.options.subcommand == "addtowhitelist") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);
            if (!CommandExecution.options.role){
                if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingRole.title`), CommandExecution.i18n.__(`command.${this.name}.missingRole.description`));
                CommandExecution.options.role = CommandExecution.options.value;
            }
            if (CommandExecution.options.role.startsWith('<@&'))CommandExecution.options.role = CommandExecution.options.role.replace('<@&', '').replace('>', '');
            let RoleToAdd = await CommandExecution.Guild.Guild.roles.fetch(CommandExecution.options.role).catch(e => undefined);

            if (!RoleToAdd)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.couldNotAddRole.title`), CommandExecution.i18n.__(`command.${this.name}.couldNotAddRole.description`));
            let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').push(CommandExecution.options.role);
            await CommandExecution.Guild.ConfigurationManager.save();

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.roleAdded.title`));
        }

        if (CommandExecution.options.subcommand == "removefromwhitelist") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);
            if (!CommandExecution.options.role){
                if (!CommandExecution.options.value)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.missingRole.title`), CommandExecution.i18n.__(`command.${this.name}.missingRole.description`));
                CommandExecution.options.role = CommandExecution.options.value;
            }
            if (CommandExecution.options.role.startsWith('<@&'))CommandExecution.options.role = CommandExecution.options.role.replace('<@&', '').replace('>', '');
            let RoleToRemove = await CommandExecution.Guild.Guild.roles.fetch(CommandExecution.options.role).catch(e => undefined);

            if (!RoleToRemove)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.couldNotRemoveRole.title`), CommandExecution.i18n.__(`command.${this.name}.couldNotRemoveRole.description`));
            let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').filter(role => role != RoleToRemove);
            await CommandExecution.Guild.ConfigurationManager.set('roleadder.whitelist', CurrentRoles);
            await CommandExecution.Guild.ConfigurationManager.save();

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.roleRemoved.title`));
        }

        if (CommandExecution.options.subcommand == "fixroles") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.manageroles))CommandExecution.denyPermission(this.permissions.manageroles);

            await new Promise((res, _rej) => {
                let rolesLeft = CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').length;
                if (rolesLeft == 0)res(true);
                CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').forEach(async role => {
                    let CouldFetchRole = await CommandExecution.Guild.Guild.roles.fetch(role).then(fRole => (typeof fRole == "undefined" || fRole == null) ? undefined : fRole).catch(e => undefined);
                    if (!CouldFetchRole){
                        let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd').filter(roleIt => roleIt != role);
                        CommandExecution.Guild.ConfigurationManager.set('roleadder.rolesToAdd', CurrentRoles);
                    }
                    rolesLeft--;
                    if (rolesLeft == 0) res(true);
                })
            });
            await new Promise((res, _rej) => {
                let rolesLeft = CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').length;
                if (rolesLeft == 0)res(true);
                CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').forEach(async role => {
                    let CouldFetchRole = await CommandExecution.Guild.Guild.roles.fetch(role).then(fRole => (typeof fRole == "undefined" || fRole == null) ? undefined : fRole).catch(e => undefined);
                    if (!CouldFetchRole){
                        let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist').filter(roleIt => roleIt != role);
                        CommandExecution.Guild.ConfigurationManager.set('roleadder.whitelist', CurrentRoles);
                    }
                    rolesLeft--;
                    if (rolesLeft == 0) res(true);
                })
            });
            await new Promise((res, _rej) => {
                let rolesLeft = CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').length;
                if (rolesLeft == 0)res(true);
                CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').forEach(async role => {
                    let CouldFetchRole = await CommandExecution.Guild.Guild.roles.fetch(role).then(fRole => (typeof fRole == "undefined" || fRole == null) ? undefined : fRole).catch(e => undefined);
                    if (!CouldFetchRole){
                        let CurrentRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist').filter(roleIt => roleIt != role);
                        CommandExecution.Guild.ConfigurationManager.set('roleadder.blacklist', CurrentRoles);
                    }
                    rolesLeft--;
                    if (rolesLeft == 0) res(true);
                })
            });
            await CommandExecution.Guild.ConfigurationManager.save();
            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.rolesFixed.title`));
        }

        if (CommandExecution.options.subcommand == "clear") {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.use))CommandExecution.denyPermission(this.permissions.use);
            
            CommandExecution.Guild.data.roleadder.queue = undefined;

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.cleared.title`));
        }

        if (["prepare", "fetch"].includes(CommandExecution.options.subcommand)) {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.use))CommandExecution.denyPermission(this.permissions.use);
            CommandExecution.Guild.data.roleadder.queue = []
            let RolesToAdd = CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd');
            if (RolesToAdd.length == 0)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.noRoleSet.title`), CommandExecution.i18n.__(`command.${this.name}.noRoleSet.description`));
            RolesToAdd.map(role => CommandExecution.Guild.Guild.roles.fetch(role).catch(e=>undefined));

            let WhitelistedRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.whitelist');

            let BlacklistedRoles = CommandExecution.Guild.ConfigurationManager.get('roleadder.blacklist');

            let TrackerEmbedFields = [
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.total.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.total.value`, {amount: (CommandExecution.Guild.data.roleadder.queue) ? CommandExecution.Guild.data.roleadder.queue.length : 0}), inline: true}
            ]
            let TrackerEmbed = new MessageEmbed().setColor(CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
            .setTitle(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.title`))
            .setDescription(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.description`, {amount: (CommandExecution.Guild.data.roleadder.queue) ? CommandExecution.Guild.data.roleadder.queue.length : 0}))
            .addFields(TrackerEmbedFields)
            CommandExecution.Guild.data.roleadder.trackerMessage = await CommandExecution.Channel.send({embeds: [TrackerEmbed]});

            CommandExecution.Guild.data.roleadder.trackerInterval = setInterval(updateFetchTrackerEmbed, 5000);

            let FetchedUsers = await CommandExecution.Guild.Guild.members.fetch({force: true, cache: false}).then(members => members.filter(member => {
                let UserHasAllRoles = RolesToAdd.every((RoleToAdd) => member.roles.cache.has(RoleToAdd));
                let UserHasAllWhitelistedRoles = WhitelistedRoles.every((whitelistedRole) => member.roles.cache.has(whitelistedRole));
                let UserHasAnyBlacklistedRoles = member.roles.cache.some((userRole) => userRole.id == BlacklistedRoles);

                if (WhitelistedRoles.length == 0)UserHasAllWhitelistedRoles = true;
                if (BlacklistedRoles.length == 0)UserHasAnyBlacklistedRoles = false;

                if (!UserHasAllRoles && !UserHasAnyBlacklistedRoles && UserHasAllWhitelistedRoles){
                    CommandExecution.Guild.data.roleadder.queue.push(member);
                }
                return (!UserHasAllRoles && !UserHasAnyBlacklistedRoles && UserHasAllWhitelistedRoles);
            }));

            clearInterval(CommandExecution.Guild.data.roleadder.trackerInterval);
            updateFetchTrackerEmbed();

            if (FetchedUsers.size == 0)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.noUsersFetched.title`));
            CommandExecution.Guild.data.roleadder.queue = FetchedUsers.map(u => u);
            CommandExecution.Guild.data.roleadder.fetchDone = true;

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.usersFetched.title`, {amount: FetchedUsers.size}));
        }

        if (["trigger"].includes(CommandExecution.options.subcommand)) {
            if (!CommandExecution.CommandManager.hasPermissionPerContext(CommandExecution, this.permissions.use))CommandExecution.denyPermission(this.permissions.use);

            if (!CommandExecution.Guild.data.roleadder.queue || CommandExecution.Guild.data.roleadder.queue.length == 0)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.noUsersInQueue.title`));
            if (!CommandExecution.Guild.data.roleadder.fetchDone)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.fetchNotDone.title`));
            
            let RolesToAdd = CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd');
            if (RolesToAdd.length == 0)return CommandExecution.returnErrorEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.noRoleSet.title`), CommandExecution.i18n.__(`command.${this.name}.noRoleSet.description`));
            RolesToAdd.map(role => CommandExecution.Guild.Guild.roles.fetch(role).catch(e=>undefined));

            let TrackerEmbedFields = [
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.totalAmount.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.totalAmount.value`, {amount: (CommandExecution.Guild.data.roleadder.queue.length) ? CommandExecution.Guild.data.roleadder.queue.length : 0}), inline: true},
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.successAmount.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.successAmount.value`, {amount: CommandExecution.Guild.data.roleadder.success.length}), inline: true},
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.failedAmount.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.failedAmount.value`, {amount: CommandExecution.Guild.data.roleadder.failed.length}), inline: true}
            ]
            let TrackerEmbed = new MessageEmbed().setColor(CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
            .setTitle(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.title`))
            .setDescription(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.description`, {amount: CommandExecution.Guild.data.roleadder.queue.length}))
            .addFields(TrackerEmbedFields)
            CommandExecution.Guild.data.roleadder.trackerMessage = await CommandExecution.Channel.send({embeds: [TrackerEmbed]});

            CommandExecution.Guild.data.roleadder.trackerInterval = setInterval(updateTriggerTrackerEmbed, 5000);

            CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.startingAddingCycle.title`, {amount: CommandExecution.Guild.data.roleadder.queue.length}));
            CommandExecution.Guild.data.roleadder.queue.forEach(async User => {
                let LogUserSave = {
                    user: User.user.id,
                    reason: CommandExecution.Guild.ConfigurationManager.get('roleadder.addReason', {TriggerReason: 'Manually triggered', TriggerUserTag: CommandExecution.RealUser.tag, TriggerUserId: CommandExecution.RealUser.id}),
                    roles: CommandExecution.Guild.ConfigurationManager.get('roleadder.rolesToAdd'),
                }

                await User.roles.add(RolesToAdd, CommandExecution.Guild.ConfigurationManager.get('roleadder.addReason', {TriggerReason: 'Manually triggered', TriggerUserTag: CommandExecution.RealUser.tag, TriggerUserId: CommandExecution.RealUser.id})).then(() => {
                    CommandExecution.Guild.data.roleadder.success.push(LogUserSave);
                }).catch(() => {
                    CommandExecution.Guild.data.roleadder.failed.push(LogUserSave);
                })
            });

            clearInterval(CommandExecution.Guild.data.roleadder.trackerInterval);
            updateTriggerTrackerEmbed();
            CommandExecution.Guild.data.roleadder.queue = undefined;

            return CommandExecution.returnSuccessEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.addingCycleDone.title`, {amount: CommandExecution.Guild.data.roleadder.queue.length, successAmount: CommandExecution.Guild.data.roleadder.success.length, failedAmount: CommandExecution.Guild.data.roleadder.failed.length}));
        }

        return CommandExecution.returnMainEmbed({ephemeral: false}, CommandExecution.i18n.__(`command.${this.name}.title`), CommandExecution.i18n.__(`command.${this.name}.defaultEmbed.description`));

        async function updateFetchTrackerEmbed() {
            let TrackerEmbedFields = [
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.total.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.total.value`, {amount: (CommandExecution.Guild.data.roleadder.queue) ? CommandExecution.Guild.data.roleadder.queue.length : 0}), inline: true}
            ]
            let TrackerEmbed = new MessageEmbed().setColor(CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
            .setTitle(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.title`))
            .setDescription(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.fetchTrackerEmbed.description`, {amount: (CommandExecution.Guild.data.roleadder.queue) ? CommandExecution.Guild.data.roleadder.queue.length : 0}))
            .addFields(TrackerEmbedFields)
            
            return CommandExecution.Guild.data.roleadder.trackerMessage.edit({embeds: [TrackerEmbed]});
        }
        
        async function updateTriggerTrackerEmbed() {
            let TrackerEmbedFields = [
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.totalAmount.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.totalAmount.value`, {amount: (CommandExecution.Guild.data.roleadder.queue.length) ? CommandExecution.Guild.data.roleadder.queue.length : 0}), inline: true},
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.successAmount.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.successAmount.value`, {amount: CommandExecution.Guild.data.roleadder.success.length}), inline: true},
                {name: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.failedAmount.name`), value: CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.failedAmount.value`, {amount: CommandExecution.Guild.data.roleadder.failed.length}), inline: true}
            ]
            let TrackerEmbed = new MessageEmbed().setColor(CommandExecution.Guild.ConfigurationManager.get('style.colors.main'))
                .setTitle(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.title`))
                .setDescription(CommandExecution.i18n.__(`command.${CommandExecution.Command.name}.triggerTrackerEmbed.description`, {amount: CommandExecution.Guild.data.roleadder.queue.length}))
                .addFields(TrackerEmbedFields)
            
            return CommandExecution.Guild.data.roleadder.trackerMessage.edit({embeds: [TrackerEmbed]});
        }
    },
    async optionsFromArgs (CommandExecution) {
        var options = {};
        if (CommandExecution.CommandOptions.length == 0)return options;
        options.subcommand = CommandExecution.CommandOptions.shift();
        if (CommandExecution.CommandOptions.length != 0)options.value = CommandExecution.CommandOptions.join(' ');
        return options;
    },
    async optionsFromSlashOptions (CommandExecution) {
        var options = Object.fromEntries(Object.entries(CommandExecution.CommandOptions).map(([key, val]) => [val.name, val.value]));
        if (typeof CommandExecution.Trigger.options._subcommand != "undefined" && CommandExecution.Trigger.options._subcommand != null) options.subCommand = CommandExecution.Trigger.options._subcommand;
        return options;
    },
    makeSlashCommand(i18n) {
        let slashCommand = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(i18n.__(`command.${this.name}.description`));

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('addrole')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.addrole.description`));
    
                subCommand.addRoleOption(option => 
                    option.setName('role')
                        .setDescription(i18n.__(`command.${this.name}.addrole.option.role.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('removerole')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.removerole.description`));
    
                subCommand.addRoleOption(option => 
                    option.setName('role')
                        .setDescription(i18n.__(`command.${this.name}.removerole.option.role.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('addtoblacklist')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.addtoblacklist.description`));
    
                subCommand.addRoleOption(option => 
                    option.setName('role')
                        .setDescription(i18n.__(`command.${this.name}.addtoblacklist.option.role.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('removefromblacklist')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.removefromblacklist.description`));
    
                subCommand.addRoleOption(option => 
                    option.setName('role')
                        .setDescription(i18n.__(`command.${this.name}.removefromblacklist.option.role.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('addtowhitelist')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.addtowhitelist.description`));
    
                subCommand.addRoleOption(option => 
                    option.setName('role')
                        .setDescription(i18n.__(`command.${this.name}.addtowhitelist.option.role.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('removefromwhitelist')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.removefromwhitelist.description`));
    
                subCommand.addRoleOption(option => 
                    option.setName('role')
                        .setDescription(i18n.__(`command.${this.name}.removefromwhitelist.option.role.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('logaddedusers')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.logaddedusers.description`));
    
                subCommand.addBooleanOption(option => 
                    option.setName('value')
                        .setDescription(i18n.__(`command.${this.name}.logaddedusers.option.description`))
                        .setRequired(true)
                )
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('prepare')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.prepare.description`));
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('trigger')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.trigger.description`));
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('clear')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.clear.description`));
    
                return subCommand;
            });

            slashCommand.addSubcommand(subCommand => {
                subCommand.setName('fixroles')
                    .setDescription(i18n.__(`command.${this.name}.subcommand.fixroles.description`));
    
                return subCommand;
            });

            

        return slashCommand;
    },
    async makeHelp(Command) {
        let returnObject = {embeds: []};
        let tempEmbed = new MessageEmbed().setTitle(Command.CommandManager.i18n.__(`commands.generic.help.title`, {name: Command.name}))
                                            .setColor(await Command.CommandManager.TobyBot.ConfigurationManager.get('style.colors.main'))
                                            .setDescription(Command.CommandManager.i18n.__(`command.${this.name}.description`));

        returnObject.embeds.push(tempEmbed) 
        return returnObject;
    }
}

function convertToCSV(arr) {
    const array = [Object.keys(arr[0])].concat(arr)
  
    return array.map(it => {
      return Object.values(it).toString()
    }).join('\n')
  }