# Toby Bot

Toby Bot v4 is on its way, rebuilding from the ground up.

## Todo, Commands, Ideas & Fixes :

### Todo:

- Web GUI (gosh i suck at making GUIs i swear..) | On its way!
- Auto setup (auto grab log channels, mute role etc..) [Discord-made & Web-Gui-made ?]
- Token scanner (check for token in messages [& reset them ?])
- Configuration converter (switching between configuration version without losing data)
- Saving configuration & permission history (+rollback?)
- Auto moderation
- DM Handling?
- Presence
- Changelog of some kind (& update alert in channel?)

### Commands:

- Autokick
- Choose
- Coinflip
- Embedfail
- Hi
- Hug
- Invitelink?
- Kiss
- Makeembed?
- Remindme
- Rockpaperscissors
- Roleadder
- Rolldice
- Russianroulette
- SendDM
- Slap
- Welcome
- Lockdown?

### Fixes:

- None

## Update docker image:

```
cd /docker/toby-bot
git checkout <branch>
git pull origin <branch>
docker-compose build --no-cache
docker-compose up
```