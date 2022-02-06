# toby-bot
Official Toby Bot repo

Things to know about TobyBot to make everything clear:
    - TobyBot cache the last 25 messages of EVERY member of a guild and keep them stored in RAM.
    - Those message cannot be seen by any other way than the lastmessages command, or by saving them.
    - Those message are never saved out of the scope of the moderation logs process & the lastmessages command.

# Todo:
- Implementation of t!lockdown command. > Will prob start it last (aside Auto Moderation ?)

- Implementation of t!purge command. > Will work on it soonish, should be an easy one

- Cleaning up Toby's code to run more efficiently. (adding permissions optitional priority too) > Working on it 
    Make the permission scan all in once not one by one (User, Internal Role, Role, Channel, Guild)

- Implementation of t!russianroulette command. > Will work on it soonish, should be an easy one

- Creation of "simpler" fun commands
                Such as: t!rolldice, t!flipcoin, t!choose, t!rockpaperscissors, etc. > Already worked on it a bit, will work more on it soonish, should be an easy one
                
- Auto Moderation Phase/ Version 4 
