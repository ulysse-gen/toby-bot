//Import needs from index
const {
    MainLog,
    globalGuilds
} = require(`../../index`);

module.exports = async function (interaction) {
    if (!interaction.isButton()) return;
    let guild = await globalGuilds.getGuild(interaction.member.guild);

    if (!guild.initialized) return false;

    if (typeof guild.waitingForInteration == "object") {
        if (typeof guild.waitingForInteration.users[interaction.user.id] == "object") {
            if (typeof guild.waitingForInteration.users[interaction.user.id][interaction.customId] == "function") {
                let res = guild.waitingForMessage.users[interaction.user.id][interaction.customId](interation);
                if (res == true) return true;
            }
        }
        if (typeof guild.waitingForInteration.channels[interaction.channelId] == "object") {
            if (typeof guild.waitingForInteration.channels[interaction.channelId][interaction.user.id] == "object") {
                if (typeof guild.waitingForInteration.channels[interaction.channelId][interaction.user.id][interaction.customId] == "function") {
                    let res = guild.waitingForInteration.channels[interaction.channelId][interaction.user.id][interaction.customId](interaction);
                    if (res == true) return true;
                }
            } else if (typeof guild.waitingForInteration.channels[interaction.channelId][interaction.customId] == "function") {
                let res = guild.waitingForInteration.channels[interaction.channelId][interaction.customId](interaction);
                if (res == true) return true;
            }
        }
    }
    //console.log(interaction);
    return false;
}