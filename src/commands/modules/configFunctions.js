module.exports = (client, message, guild, configEntries) => {
    
    configEntries[`behaviour.logToChannel.status`].checkerFunction = (configPath, configValue) => {
        if (isSameAsDefault(`behaviour.logToChannel.channel`)) return {
            break: true,
            title: "Set the logging channel before enabling.",
            description: `Use \`${guild.configurationManager.configuration.prefix}conf set behaviour.logToChannel.channel <#ChannelId>\` to set the channel.`
        };
        return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
            fetchedGuild.channels.fetch(_.get(guild.configurationManager.configuration, `behaviour.logToChannel.channel`)).then(fetchedChannel => {
                fetchedChannel.send(`Channel logging enabled.`).then(() => {
                    return {
                        break: false
                    }
                }).catch(err => {
                    return {
                        break: true,
                        title: `Could not enable`,
                        description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                        error: err
                    }
                })
            }).catch(err => {
                _.set(guild.configurationManager.configuration, `behaviour.logToChannel.channel`, _.get(defaultConfig, `behaviour.logToChannel.channel`));
                return {
                    break: true,
                    title: `Could not enable`,
                    description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                    error: err
                };
            })
        }).catch(err => {
            _.set(guild.configurationManager.configuration, `behaviour.logToChannel.channel`, _.get(defaultConfig, `behaviour.logToChannel.channel`));
            return {
                break: true,
                title: `Could not enable`,
                description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
                error: err
            };
        });
    }

    configEntries[`behaviour.logToChannel.channel`].checkerFunction = (configPath, configValue) => {
        if (isSameAsDefault(`behaviour.logToChannel.status`)) return {
            break: true,
            title: "You may now enable channel logging.",
            description: `Use \`${guild.configurationManager.configuration.prefix}conf set behaviour.logToChannel.status <true/false>\` to enable.`
        };
        return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
            fetchedGuild.channels.fetch(configValue).then(fetchedChannel => {
                fetchedChannel.send(`This channel has been defined as the logging channel, you can enable channel logging now.`).then(() => {
                    return {
                        break: false,
                        title: "You may now enable channel logging.",
                        description: `Use \`${guild.configurationManager.configuration.prefix}conf set behaviour.logToChannel.status <true/false>\` to enable.`
                    }
                }).catch(err => {
                    return {
                        break: true,
                        title: `Could not enable`,
                        description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                        error: err
                    }
                })
            }).catch(err => {
                _.set(guild.configurationManager.configuration, `behaviour.logToChannel.status`, _.get(defaultConfig, `behaviour.logToChannel.status`));
                return {
                    break: true,
                    title: `Could not enable`,
                    description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                    error: err
                };
            })
        }).catch(err => {
            _.set(guild.configurationManager.configuration, `behaviour.logToChannel.status`, _.get(defaultConfig, `behaviour.logToChannel.status`));
            return {
                break: true,
                title: `Could not enable`,
                description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
                error: err
            };
        });
    }

    return configEntries;
}