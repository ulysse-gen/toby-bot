# toby-bot
Official Toby Bot repo

Things saved by TobyBot:
    - 25 last messages of every guild members is saved in RAM
    - Those messages are saved in a database (Content, Timestamp, GuildID, ChannelID & UserID) after a punishment is made (Warn, Mute, Kick, Ban)
    - Those messages are saved in a channel when a moderator use the command t!lastmessages
    - Those messages are earased from the RAM when the bot is restarted, never to be seen again if not saved in database and/or channel.

# Todo:
- Implementation of t!lockdown command. > Will look into it, may take a little bit to get the whole thing in my mind

- Cleaning up Toby's code to run more efficiently. > Constantly working on it when changing bit of codes here and there

- Make the permission scan all in once not one by one (User, Internal Role, Role, Channel, Guild). > Will work on it later, im tired of playing with permissions rn

- Add a permission (optionnal) priority > Will work on it later, im tired of playing with permissions rn

- Implementation of t!russianroulette command. > Will work on it soonish, should be an easy one
                
- Auto Moderation Phase/ Version 4. > Should start working on it soonish, will take some time, may implement slowly
