# toby-bot
Official Toby Bot repo

Things saved by TobyBot:
- 25 last messages of every guild members is saved in RAM
- Those messages are saved in a database (Content, Timestamp, GuildID, ChannelID & UserID) after a punishment is made (Warn, Mute, Kick, Ban)
- Those messages are saved in a channel when a moderator use the command t!lastmessages
- Those messages are earased from the RAM when the bot is restarted, never to be seen again if not saved in database and/or channel.

# Todo:
- Implementation of t!lockdown command. > Will look into it, may take a little bit to get the whole thing in my mind

- Make the permission scan all in once not one by one (User, Internal Role, Role, Channel, Guild) & allow priority > Will work on it later, im tired of playing with permissions rn
                
- Auto Moderation Phase/ Version 4. > Should start working on it soonish, will take some time, may implement slowly





/*Random Shit*/
Join VC: discordVoice.joinVoiceChannel({channelId:'912775305842794517',guildId:'891829347613306960',adapterCreator: guild.guild.voiceAdapterCreator});