module.exports = {
  "prefix": {
    "name": "Bot Prefix",
    "description": "The prefix to trigger any of the bot's commands"
  },
  "colors": {
    "success": {
      "name": "Success Embed Color",
      "description": "The color of the success embeds."
    },
    "error": {
      "name": "Error Embed Color",
      "description": "The color of the error embeds."
    },
    "warning": {
      "name": "Warning Embed Color",
      "description": "The color of the warning embeds."
    },
    "main": {
      "name": "Main Embed Color",
      "description": "The color of the main embeds."
    }
  },
  "behaviour": {
    "onCommandErrorIgnore": {
      "name": "Ignore Command Errors",
      "description": "Disable this to return an error when a command errors."
    },
    "onCommandDeniedIgnore": {
      "name": "Ignore Command Denied",
      "description": "Disable this to return an error when a command is denied."
    },
    "onUnknownCommandIgnore": {
      "name": "Ignore Unknown Command",
      "description": "Disable this to return an error when an unknown command is triggered."
    },
    "onWarningIgnore": {
      "name": "Ignore Command Warnings",
      "description": "Disable this to return an error when a command warning."
    },
    "onCooldownIgnore": {
      "name": "Ignore Command Cooldown",
      "description": "Disable this to return an error when a cooldowned command is executed."
    },
    "autoDeleteCommands": {
      "name": "Auto Delete Commands",
      "description": "Enable this to delete the message triggering the command."
    },
    "logOnCommandError": {
      "name": "Log Command Errors",
      "description": "Enable this to log when a command errors."
    },
    "logOnCommandDenied": {
      "name": "Log Command Errors",
      "description": "Enable this to log when a command is denied."
    },
    "logOnUnknownCommand": {
      "name": "Log Unknown Command",
      "description": "Enable this to log when an unknown command is triggered."
    },
    "logOnWarning": {
      "name": "Log Command Warning",
      "description": "Enable this to log when a command warning."
    },
    "logOnCooldown": {
      "name": "Log Command Cooldown",
      "description": "Enable this to log when a cooldowned command is executed."
    },
    "logCommandExecutions": {
      "name": "Log Command Executions",
      "description": "Enable this to log when a command is executed."
    },
    "logSaidMessages": {
      "name": "Log Said Messages",
      "description": "Enable this to log things sent thru the say command."
    },
    "logDiscordErrors": {
      "name": "Log Discord Error",
      "description": "Enable this to log when a discord error occurs."
    },
    "deleteMessageOnUnknown": {
      "name": "Delete Message On Unknown",
      "description": "Enable this to delete the unknown command error."
    },
    "deleteMessageOnDeny": {
      "name": "Delete Message On Denied",
      "description": "Enable this to delete the denied command error."
    },
    "deleteMessageOnCooldown": {
      "name": "Delete Message On Cooldown",
      "description": "Enable this to delete the cooldown command error."
    },
    "sendConfigInEmbed": {
      "deprecated": undefined,
      "name": "Send Config In Embed",
      "description": "Enable this to send the config in embed."
    },
    "helpOnlySendPermissionnedCommands": {
      "name": "Only Send Commands With Permission In Help",
      "description": "Enable this for the help command to list only the command the user has permission to execute."
    },
    "logToChannel": {
      "status": {
        "name": "Log To Channel",
        "description": "Enable this to allow the bot to log in the logging channel. Logging channel must be defined before.",
        "checkerFunction": async (client, message, guild, configEntries, configPath, configValue) => {
          if (configValue == undefined) return {
            break: undefined
          }
          if (configEntries[`behaviour.logToChannel.channel`].defaultValue == configEntries[`behaviour.logToChannel.channel`].value) return {
            break: undefined,
            title: "Set the logging channel before enabling.",
            description: `Use \`${guild.configurationManager.configuration.prefix}conf set behaviour.logToChannel.channel <#ChannelId>\` to set the channel.`
          };
          return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
            return fetchedGuild.channels.fetch(configEntries[`behaviour.logToChannel.channel`].value).then(fetchedChannel => {
              return fetchedChannel.send(`Channel logging enabled.`).then(() => {
                return {
                  break: undefined
                }
              }).catch(err => {
                return {
                  break: undefined,
                  title: `Could not enable`,
                  description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                  error: err
                }
              })
            }).catch(err => {
              return {
                break: undefined,
                title: `Could not enable`,
                description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                error: err
              };
            })
          }).catch(err => {
            return {
              break: undefined,
              title: `Could not enable`,
              description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
              error: err
            };
          });
        },
        "execAfter": async (client, message, guild, configEntries, configPath, configValue) => guild.initChannelLogging()
      },
      "channel": {
        "name": "Channel To Log To",
        "description": "Define which channel will be used to log.",
        "checkerFunction": async (client, message, guild, configEntries, configPath, configValue) => {
          let newValue = (configValue.startsWith('<#')) ? configValue.replace('<#', '').replace('>', '') : configValue;
          return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
            return fetchedGuild.channels.fetch(newValue).then(fetchedChannel => {
              return fetchedChannel.send(`Channel logging enabled.`).then(() => {
                return {
                  break: undefined,
                  newValue
                }
              }).catch(err => {
                return {
                  break: undefined,
                  title: `Could not enable`,
                  description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                  error: err
                }
              })
            }).catch(err => {
              return {
                break: undefined,
                title: `Could not enable`,
                description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                error: err
              };
            })
          }).catch(err => {
            return {
              break: undefined,
              title: `Could not enable`,
              description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
              error: err
            };
          });
        },
        "execAfter": async (client, message, guild, configEntries, configPath, configValue) => guild.initChannelLogging()
      },
      "embed": {
        "name": "Log With Embeds",
        "description": "Enable to enable logging with embeds."
      },
      "format": {
        "name": "Log Format",
        "description": "Adjust the format of the logging, have almost no effect when embed logging is enabled."
      }
    },
    "ignoreBots": {
      "name": "Ignore Bots",
      "description": "Enable this for the bot to entirely ignore bots."
    },
    "ignoreChannels": {
      "name": "Ignored Channels",
      "description": "Channels listed here will be entirely ignored by the bot."
    },
    "ignoreUsers": {
      "name": "Ignored Users",
      "description": "Users listed here will be entirely ignored by the bot [In your guild]."
    },
  },
  "autokick": {
    "status": undefined,
    "trigger": undefined,
    "logKickedUsers": undefined,
    "triggerNeeded": undefined,
    "kickReason": undefined,
    "rolesToKick": undefined,
    "blacklist": undefined
  },
  "roleadder": {
    "status": undefined,
    "trigger": undefined,
    "logAddedUsers": undefined,
    "addReason": undefined,
    "rolesToAdd": undefined,
    "blacklist": undefined,
    "whitelist": undefined
  },
  "moderation": {
    "logToChannel": {
      "status": {
        "name": "Log Moderation To Channel",
        "description": "Enable this to allow the bot to log the moderation in the moderation logging channel. Moderation logging channel must be defined before.",
        "checkerFunction": async (client, message, guild, configEntries, configPath, configValue) => {
          if (configValue == undefined) return {
            break: undefined
          }
          if (configEntries[`moderation.logToChannel.channel`].defaultValue == configEntries[`moderation.logToChannel.channel`].value) return {
            break: undefined,
            title: "Set the logging channel before enabling.",
            description: `Use \`${guild.configurationManager.configuration.prefix}conf set moderation.logToChannel.channel <#ChannelId>\` to set the channel.`
          };
          return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
            return fetchedGuild.channels.fetch(configEntries[`moderation.logToChannel.channel`].value).then(fetchedChannel => {
              return fetchedChannel.send(`Channel logging enabled.`).then(() => {
                return {
                  break: undefined
                }
              }).catch(err => {
                return {
                  break: undefined,
                  title: `Could not enable`,
                  description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                  error: err
                }
              })
            }).catch(err => {
              return {
                break: undefined,
                title: `Could not enable`,
                description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                error: err
              };
            })
          }).catch(err => {
            return {
              break: undefined,
              title: `Could not enable`,
              description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
              error: err
            };
          });
        },
        "execAfter": async (client, message, guild, configEntries, configPath, configValue) => guild.initModerationLogging()
      },
      "channel": {
        "name": "Channel To Log Moderation To",
        "description": "Define which channel will be used to log the moderation.",
        "checkerFunction": async (client, message, guild, configEntries, configPath, configValue) => {
          let newValue = (configValue.startsWith('<#')) ? configValue.replace('<#', '').replace('>', '') : configValue;
          return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
            return fetchedGuild.channels.fetch(newValue).then(fetchedChannel => {
              return fetchedChannel.send(`Channel logging enabled.`).then(() => {
                return {
                  break: undefined,
                  newValue
                }
              }).catch(err => {
                return {
                  break: undefined,
                  title: `Could not enable`,
                  description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                  error: err
                }
              })
            }).catch(err => {
              return {
                break: undefined,
                title: `Could not enable`,
                description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                error: err
              };
            })
          }).catch(err => {
            return {
              break: undefined,
              title: `Could not enable`,
              description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
              error: err
            };
          });
        },
        "execAfter": async (client, message, guild, configEntries, configPath, configValue) => guild.initModerationLogging()
      }
    },
    "autoModeration": {
      "channel": {
        "status": {
          "name": "Log AutoModeration To Channel",
          "description": "Enable this to allow the bot to log the moderation in the AutoModeration logging channel. AutoModeration logging channel must be defined before.",
          "checkerFunction": async (client, message, guild, configEntries, configPath, configValue) => {
            if (configValue == undefined) return {
              break: undefined
            }
            if (configEntries[`autoModeration.channel.channel`].defaultValue == configEntries[`autoModeration.channel.channel`].value) return {
              break: undefined,
              title: "Set the logging channel before enabling.",
              description: `Use \`${guild.configurationManager.configuration.prefix}conf set autoModeration.channel.channel <#ChannelId>\` to set the channel.`
            };
            return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
              return fetchedGuild.channels.fetch(configEntries[`autoModeration.channel.channel`].value).then(fetchedChannel => {
                return fetchedChannel.send(`Channel logging enabled.`).then(() => {
                  return {
                    break: undefined
                  }
                }).catch(err => {
                  return {
                    break: undefined,
                    title: `Could not enable`,
                    description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                    error: err
                  }
                })
              }).catch(err => {
                return {
                  break: undefined,
                  title: `Could not enable`,
                  description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                  error: err
                };
              })
            }).catch(err => {
              return {
                break: undefined,
                title: `Could not enable`,
                description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
                error: err
              };
            });
          },
          "execAfter": async (client, message, guild, configEntries, configPath, configValue) => guild.initAutoModerationLogging()
        },
        "channel": {
          "name": "Channel To Log AutoModeration To",
          "description": "Define which channel will be used to log the AutoModeration.",
          "checkerFunction": async (client, message, guild, configEntries, configPath, configValue) => {
            let newValue = (configValue.startsWith('<#')) ? configValue.replace('<#', '').replace('>', '') : configValue;
            return client.guilds.fetch(message.channel.guild.id).then(fetchedGuild => {
              return fetchedGuild.channels.fetch(newValue).then(fetchedChannel => {
                return fetchedChannel.send(`Channel logging enabled.`).then(() => {
                  return {
                    break: undefined,
                    newValue
                  }
                }).catch(err => {
                  return {
                    break: undefined,
                    title: `Could not enable`,
                    description: `Could not use the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                    error: err
                  }
                })
              }).catch(err => {
                return {
                  break: undefined,
                  title: `Could not enable`,
                  description: `Could not fetch the channel for the logging channel. Please re define the logging channel or fix permissions.`,
                  error: err
                };
              })
            }).catch(err => {
              return {
                break: undefined,
                title: `Could not enable`,
                description: `Could not fetch the guild for the logging channel. This should not happen. Please re define the logging channel.`,
                error: err
              };
            });
          },
          "execAfter": async (client, message, guild, configEntries, configPath, configValue) => guild.initAutoModerationLogging()
        }
      },
      "staffRoleForAlert": {
        "name": "Staff Alert Role",
        "description": "Roles listed here will be pinged when the 'alert' reaction."
      },
      "ignoredChannels": {
        "name": "AutoModeration Ignored Channels",
        "description": "Channels listed here will be completely ignored by the AutoModeration."
      },
      "ignoredRoles": {
        "name": "AutoModeration Ignored Roles",
        "description": "Roles listed here will be completely ignored by the AutoModeration."
      },
      "warnReason": {
        "name": "AutoModeration Warn Reason",
        "description": "Define the reason that will be used to warn members with the 'warn' reaction."
      },
      "muteReason": {
        "name": "AutoModeration Mute Reason",
        "description": "Define the reason that will be used to mute members with the 'mute' reaction."
      },
      "muteDuration": {
        "name": "AutoModeration Mute Duration",
        "description": "Define the duration of the mute issued by the 'mute' reaction. (in minutes, define 0 to be permanent)"
      },
      "kickReason": {
        "name": "AutoModeration Kick Reason",
        "description": "Define the reason that will be used to kick members with the 'kick' reaction."
      },
      "banReason": {
        "name": "AutoModeration Ban Reason",
        "description": "Define the reason that will be used to ban members with the 'ban' reaction."
      },
      "banDuration": {
        "name": "AutoModeration Ban Duration",
        "description": "Define the duration of the ban issued by the 'ban' reaction. (in minutes, define 0 to be permanent)"
      },
      "modules": {
        "links": {
          "status": {
            "name": "AutoModeration Links",
            "description": "Enable this to enable AutoModeration links module."
          },
          "reaction": undefined,
          "ignoreNonExistandTDLs": {
            "name": "Ignore Non Existent Top Domain Level",
            "description": "Enable this to ingore non existent TDLs (this.isAfakeDomain)."
          },
          "ignoredChannels": undefined,
          "allowed": {
            "name": "AutoModeration Allowed Links",
            "description": "Links listed here will not trigger the AutoModeration."
          },
          "overwrite": {
            "allow": {
              "name": "AutoModeration Overwrite Allowed Links",
              "description": "Links listed here will get entirely ignored by AutoModeration."
            },
            "deny": {
              "name": "AutoModeration Overwrite Allowed Links",
              "description": "Links listed here will always trigger AutoModeration. (This has priority over allow overwrite)"
            }
          }
        },
        "email": {
          "status": {
            "name": "AutoModeration Email",
            "description": "Enable this to enable AutoModeration emails module."
          },
          "reaction": undefined,
          "ignoredChannels": undefined
        },
        "IPs": {
          "status": {
            "name": "AutoModeration IPs",
            "description": "Enable this to enable AutoModeration IPs module."
          },
          "reaction": undefined,
          "ignoredChannels": undefined
        },
        "wordsDetection": {
          "status": undefined,
          "log": undefined,
          "alert": undefined,
          "delete": undefined,
          "warn": undefined,
          "mute": undefined,
          "kick": undefined,
          "ban": undefined,
          "ignoredChannels": undefined,
          "overwriteAllow": undefined
        },
        "allCaps": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined
        },
        "duplicateText": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined,
          "threshold": {
            "amount": undefined
          }
        },
        "fastMessageSpam": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined,
          "threshold": {
            "time": undefined,
            "amount": undefined
          }
        },
        "discordInvite": {
          "status": {
            "name": "AutoModeration Discord Invite",
            "description": "Enable this to enable AutoModeration discord invite module."
          },
          "reaction": undefined,
          "ignoredChannels": undefined
        },
        "massMentions": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined,
          "threshold": {
            "time": undefined,
            "amount": undefined
          }
        },
        "imageSpam": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined,
          "threshold": {
            "time": undefined,
            "amount": undefined,
          }
        },
        "emojiSpam": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined,
          "threshold": {
            "amount": undefined,
          }
        },
        "stickerSpam": {
          "status": undefined,
          "reaction": undefined,
          "ignoredChannels": undefined,
          "threshold": {
            "time": undefined,
            "amount": undefined,
          }
        },
        "scams": {
          "status": {
            "name": "AutoModeration Scams",
            "description": "Enable this to enable AutoModeration scams module."
          },
          "reaction": undefined,
          "ignoredChannels": undefined,
          "links": {
            "name": "AutoModeration Scams Links",
            "description": "Enable this to enable AutoModeration scams links module. (Main scam module need to be enabled)"
          },
          "terms": {
            "name": "AutoModeration Scams Terms",
            "description": "Enable this to enable AutoModeration scams terms module. (Main scam module need to be enabled)"
          },
          "slashes": {
            "name": "AutoModeration Scams Slashes",
            "description": "Enable this to enable AutoModeration scams slashes module. (Main scam module need to be enabled)"
          }
        }
      }
    },
    "kickNeedReason": {
      "name": "Kick Need Reason",
      "description": "Enable this to force moderators to input a reason for kicks."
    },
    "banNeedReason": {
      "name": "Ban Need Reason",
      "description": "Enable this to force moderators to input a reason for bans."
    },
    "muteNeedReason": {
      "name": "Mute Need Reason",
      "description": "Enable this to force moderators to input a reason for mutes."
    },
    "unbanNeedReason": {
      "name": "Unban Need Reason",
      "description": "Enable this to force moderators to input a reason for unbans."
    },
    "unmuteNeedReason": {
      "name": "Unmute Need Reason",
      "description": "Enable this to force moderators to input a reason for unmutes."
    },
    "deletePunishmentNeedReason": {
      "name": "Delete Punishment Need Reason",
      "description": "Enable this to force moderators to input a reason to delete punishments."
    },
    "sendBanAlertInDM": {
      "name": "Send Ban Alert In DMs",
      "description": "Enable this to send banned users an alert of their bans."
    },
    "sendKickAlertInDM": {
      "name": "Send Kick Alert In DMs",
      "description": "Enable this to send banned users an alert of their kicks."
    },
    "sendMuteAlertInDM": {
      "name": "Send Mute Alert In DMs",
      "description": "Enable this to send banned users an alert of their mutes."
    },
    "sendWarningInDM": {
      "name": "Send Warning Alert In DMs",
      "description": "Enable this to send banned users an alert of their warns."
    },
    "muteRole": {
      "name": "Muted Role",
      "description": "Define the role used for the mutes."
    }
  },
  "lockdown": {
    "status": undefined,
    "globalLock": undefined,
    "currentlyLocked": undefined
  }
}