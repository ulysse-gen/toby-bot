# Toby Bot

Toby Bot v4 is on its way, rebuilding from the ground up.

## Todo, Commands, Ideas & Fixes :

### Todo:

- Web GUI (gosh i suck at making GUIs i swear..)
- ^ Somewhat linked with Web GUI | Add new API endpoints for configurations, guilds, bot control
- API Dynamic loading of user
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

- Whois & similar fallback to self  

## Update docker image:

```
cd /docker/toby-bot
git checkout <branch>
git pull origin <branch>
docker build --rm --pull -f "/docker/toby-bot/Dockerfile" -t "tobybot:latest" "/docker/toby-bot"
> ^ Need to check if this is actually needed
docker-compose up
```