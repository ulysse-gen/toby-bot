//Import needs from index
const {
    MainLog,
    globalGuilds
} = require(`../../index`);

module.exports = async function (interaction) {
    if (!interaction.isButton()) return;
    let guild = await globalGuilds.getGuild(interaction.member.guild);
    
    if (!guild.initialized) return interaction.reply({
        content: 'Guild not initialized yet. Cannot process interaction.',
        ephemeral: true,
    });

    if (typeof guild.waitingForInteraction == "object") {
        if (typeof guild.waitingForInteraction.users[interaction.user.id] == "object") {
            if (typeof guild.waitingForInteraction.users[interaction.user.id][interaction.customId] == "function") {
                let res = guild.waitingForMessage.users[interaction.user.id][interaction.customId](interaction);
                if (res == true) return true;
            }
        }
        if (typeof guild.waitingForInteraction.channels[interaction.channelId] == "object") {
            if (typeof guild.waitingForInteraction.channels[interaction.channelId][interaction.user.id] == "object") {
                if (typeof guild.waitingForInteraction.channels[interaction.channelId][interaction.user.id][interaction.customId] == "function") {
                    let res = guild.waitingForInteraction.channels[interaction.channelId][interaction.user.id][interaction.customId](interaction);
                    if (res == true) return true;
                }
            } else if (typeof guild.waitingForInteraction.channels[interaction.channelId][interaction.customId] == "function") {
                let res = guild.waitingForInteraction.channels[interaction.channelId][interaction.customId](interaction);
                if (res == true) return true;
            }
        }
    }
    interaction.reply({
        content: 'This interaction could not be processed.',
        ephemeral: true,
    });
    //console.log(interaction);
    return false;
}