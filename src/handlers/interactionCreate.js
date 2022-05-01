//Import needs from index
const {
    globalGuilds,
    globalMetrics
} = require(`../../index`);

module.exports = async function (interaction) {
    let interactionMetric = globalMetrics.createMetric(interaction.id);
    interaction.customMetric = interactionMetric;
    interactionMetric.addEntry(`IteractionCreation`);

    let guild = await globalGuilds.getGuild(interaction.member.guild);

    if (!guild.initialized) return interaction.reply({
        content: 'Guild not initialized yet. Cannot process interaction.',
        ephemeral: true,
    }).catch(e => {});

    if (interaction.isCommand()) {
        let ran = await require(`./commandHandler`)(interaction, guild, true);
        return (ran) ? true : interaction.reply({
            content: `This slash command isnt built yet or the return has failed. Use the regular command system with the \`${guild.configurationManager.configuration.prefix}\` prefix.`,
            ephemeral: true
        }).catch(e => {});
    }else if (interaction.isButton()) {
        if (typeof guild.waitingForInteraction == "object") {
            if (typeof guild.waitingForInteraction.users[interaction.user.id] == "object") {
                if (typeof guild.waitingForInteraction.users[interaction.user.id][interaction.customId] == "function") {
                    let res = await guild.waitingForMessage.users[interaction.user.id][interaction.customId](interaction);
                    if (res) return true;
                }
            }
            if (typeof guild.waitingForInteraction.channels[interaction.channelId] == "object") {
                if (typeof guild.waitingForInteraction.channels[interaction.channelId][interaction.user.id] == "object") {
                    if (typeof guild.waitingForInteraction.channels[interaction.channelId][interaction.user.id][interaction.customId] == "function") {
                        let res = await guild.waitingForInteraction.channels[interaction.channelId][interaction.user.id][interaction.customId](interaction);
                        if (res) return true;
                    }
                } else if (typeof guild.waitingForInteraction.channels[interaction.channelId][interaction.customId] == "function") {
                    let res = await guild.waitingForInteraction.channels[interaction.channelId][interaction.customId](interaction);
                    if (res) return true;
                }
            }
        }
    }

    return interaction.reply({
        content: 'This interaction could not be processed.',
        ephemeral: true,
    }).catch(e => {});
}