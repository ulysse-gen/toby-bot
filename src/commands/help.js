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
        let embedFields = [];
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
            if (command.status && hasPermission && (typeof category != "undefined") ? command.category == category : true) embedFields.push([`**${command.name}**`,
                `${(command.aliases.length != 0) ? `Aliases : \`${command.aliases.join('`, `')}\`` : ``}\nDescription : ${command.description}\nCategory: \`${command.category}\`\nPermission : \`${(command.permission.length <= 500) ? command.permission : `The command permission is too long to be shown.`}\`\nNested permissions: ${(Object.keys(command.nestedPermissions).length != 0) ? `\`${Object.values(command.nestedPermissions).join(`\`, \``)}\`` : `No other permissions`}`, false
            ]);
        }

        embedPages = splitArrayIntoChunksOfLen(embedFields, 8);
        embed.footer = {
            text: `Use \`${guild.configuration.prefix}help [page number] [category]\` to search thru pages. [1/${embedPages.length}]`
        };


        embedFields = embedPages[0];
        if (args.length == 1) {
            try {
                args[0] = parseInt(args[0]);
            } catch (e) {
                return utils.sendError(message, guild, `Pages must be selected by numbers.`);
            }
            embed.footer = {
                text: `Use \`${guild.configuration.prefix}help [page number] [category]\` to search thru pages. [${args[0]}/${embedPages.length}]`
            };
            if (typeof embedPages[args[0] - 1] == "undefined") return utils.sendError(message, guild, `This page does not exist`);
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