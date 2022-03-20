const {
    MessageEmbed
} = require(`discord.js`);
const {
    globalCommands,
    configuration,
    globalPermissions
} = require(`../../index`);
const utils = require(`../utils`);

module.exports = {
    name: "help",
    description: `A list of all commands you can trigger with your permissions.`,
    aliases: ["?"],
    permission: `commands.help`,
    category: `informations`,
    async exec(client, message, args, guild = undefined) {
        if (args.length == 0) {
            let description = `List of ${configuration.appName}'s commands *(Only list the commands you can execute)* **[${Object.keys(globalCommands.commands).length}]**: \n`;
            let embedFields = [];
            for (const command of globalCommands.commands) {
                let permissionToCheck = command.permission;
                let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
                let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;
                if (command.status && hasPermission) description += `\`${command.name}\` `;
            }
            embedFields.push([`**Show all the commands with detail :**`, `${guild.configuration.prefix}help detail [page number]`, false]);
            embedFields.push([`**Show all the commands within a category with detail :**`, `${guild.configuration.prefix}help detail <category> <page number>`, false]);
            embedFields.push([`**Show help for a certain command :**`, `${guild.configuration.prefix}help <command name>`, false]);
            return utils.sendEmbed(message, guild, `Help`, description, guild.configuration.colors.main, embedFields)
        }
        if (args[0] == "detail") {
            let embedFields = [];
            let embedPages = [];
            let category = (args.length == 3) ? args[1] : undefined;
            let embed = new MessageEmbed({
                title: `${configuration.appName} - Detailed help${(typeof category != "undefined") ? ` for category ${category}` : ``}`,
                color: guild.configuration.colors.main
            });
            for (const command of globalCommands.commands) {
                let permissionToCheck = command.permission;
                let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
                let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;
                if (command.status && hasPermission && (typeof category == "undefined" || command.category == category)) embedFields.push([`**${command.name}**`,
                    `${(command.aliases.length != 0) ? `Aliases : \`${command.aliases.join('`, `')}\`` : ``}\nDescription : ${command.description}\nCategory: \`${command.category}\`\nPermission : \`${(command.permission.length <= 500) ? command.permission : `The command permission is too long to be shown.`}\`\nNested permissions: ${(Object.keys(command.nestedPermissions).length != 0) ? `\`${Object.values(command.nestedPermissions).join(`\`, \``)}\`` : `No other permissions`}`, false
                ]);
            }
            if (embedFields.length == 0)return utils.sendError(message, guild, `Unknown category`, undefined, undefined, undefined, undefined, -1, -1);
            embedPages = splitArrayIntoChunksOfLen(embedFields, 8);
            embed.footer = {
                text: `Use \`${guild.configuration.prefix}help detail [page number]\` to search thru pages. [1/${embedPages.length}]`
            };
            embedFields = embedPages[0];
            if (args.length == 2) {
                try {
                    args[1] = parseInt(args[1]);
                } catch (e) {
                    return utils.sendError(message, guild, `Pages must be selected by numbers.`, undefined, [], true); /*Updated To New Utils*/
                }
                embed.footer = {
                    text: `Use \`${guild.configuration.prefix}help detail [page number]\` to search thru pages. [${args[1]}/${embedPages.length}]`
                };
                if (typeof embedPages[args[1] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`, undefined, [], true); /*Updated To New Utils*/
                embedFields = embedPages[args[1] - 1];
            }
            embedFields.forEach(embedField => {
                embed.addField(embedField[0], embedField[1], embedField[2]);
            });
            message.reply({
                embeds: [embed],
                failIfNotExists: false
            }, false).then(msg => {
                if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
            }).catch(e => utils.messageReplyFailLogger(message, guild, e));
            return true;
        }
        let command = globalCommands.fetch(args[0]);
        if (!command)return utils.sendError(message, guild, `Unknown command`, undefined, undefined, undefined, undefined, -1, -1);
        let embedFields = [];
        let subCommandsFields = [];
        embedFields.push([`**Category**`, `${command.category}`, true]);
        embedFields.push([`**Permission**`, `${command.permission}`, true]);
        embedFields.push([`**Aliases**`, `\`${command.aliases.join('`, `')}\``, true]);
        embedFields.push([`**Cooldown**`, `${command.cooldown}`, true]);
        embedFields.push([`**Global cooldown** *(This cooldown is shared by every user)*`, `${command.globalCooldown}`, true]);
        embedFields.push([`**Nested permissions**`, `\`${Object.values(command.nestedPermissions).join('`, `')}\``, false]);
        if (Object.keys(command.subcommands).length != 0){
            for (const subcommand in command.subcommands) {
                let usage = `**Usage :** \`${guild.configuration.prefix}${command.name}${subcommand}`;
                command.subcommands[subcommand].args.forEach(arg => {
                    if (arg.optionnal)usage += ` [${arg.placeholder.join('/')}]`;
                    if (!arg.optionnal)usage += ` <${arg.placeholder.join('/')}>`;
                });
                subCommandsFields.push([`**${subcommand}**`, `**Description:** ${command.subcommands[subcommand].description}\n${usage}\``, false]);
                console.log(command.subcommands[subcommand]);
            }
        }
        if (subCommandsFields.length == 0)return utils.sendEmbed(message, guild, `Help for command '${command.name}'`, `**Description**: \n${command.description}`, guild.configuration.colors.main, embedFields);
        utils.sendEmbed(message, guild, `Help for command '${command.name}'`, `**Description**: \n${command.description}`, guild.configuration.colors.main, embedFields);
        return utils.sendEmbed(message, guild, `${command.name} sub commands`, `Sub commands and their usage :`, guild.configuration.colors.main, subCommandsFields);

        return true;
        //let embedFields = [];
        let embedPages = [];
        let category = (args.length == 2) ? args[1] : undefined;
        let embed = new MessageEmbed({
            title: `${configuration.appName}'s help ${typeof category != "undefined" ? `[${category}]` : ""}`,
            color: guild.configuration.colors.main
        });

        for (const command of globalCommands.commands) {
            let permissionToCheck = command.permission;
            let hasGlobalPermission = await globalPermissions.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id, true);
            let hasPermission = (hasGlobalPermission == null) ? await guild.permissionsManager.userHasPermission(permissionToCheck, message.author.id, undefined, message.channel.id, message.guild.id) : hasGlobalPermission;
            if (command.status && hasPermission) embedFields.push([`**${command.name}**`,
                `${(command.aliases.length != 0) ? `Aliases : \`${command.aliases.join('`, `')}\`` : ``}\nDescription : ${command.description}\nCategory: \`${command.category}\`\nPermission : \`${(command.permission.length <= 500) ? command.permission : `The command permission is too long to be shown.`}\`\nNested permissions: ${(Object.keys(command.nestedPermissions).length != 0) ? `\`${Object.values(command.nestedPermissions).join(`\`, \``)}\`` : `No other permissions`}`, false
            ]);
        }

        embedPages = splitArrayIntoChunksOfLen(embedFields, 8);
        embed.footer = {
            text: `Use \`${guild.configuration.prefix}help [page number]\` to search thru pages. [1/${embedPages.length}]`
        };


        embedFields = embedPages[0];
        if (args.length == 1) {
            try {
                args[0] = parseInt(args[0]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`, undefined, [], true); /*Updated To New Utils*/
            }
            embed.footer = {
                text: `Use \`${guild.configuration.prefix}help [page number]\` to search thru pages. [${args[0]}/${embedPages.length}]`
            };
            if (typeof embedPages[args[0] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`, undefined, [], true); /*Updated To New Utils*/
            embedFields = embedPages[args[0] - 1];
        }

        embedFields.forEach(embedField => {
            embed.addField(embedField[0], embedField[1], embedField[2]);
        });

        message.reply({
            embeds: [embed],
            failIfNotExists: false
        }, false).then(msg => {
            if (guild.configuration.behaviour.autoDeleteCommands) message.delete().catch(e => utils.messageDeleteFailLogger(message, guild, e));
        }).catch(e => utils.messageReplyFailLogger(message, guild, e));
        return true;
    }
}

function splitArrayIntoChunksOfLen(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}