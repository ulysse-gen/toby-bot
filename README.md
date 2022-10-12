# Toby Bot

Toby Bot v4 is on its way, rebuilding from the ground up.

## Inside things:

- GuildManager, UserManager, Guild, User extending original Discord's managers

## Todo, Commands, Ideas & Fixes :

### Todo:

- Web GUI (gosh i suck at making GUIs i swear..) | On its way!
- Auto setup (auto grab log channels, mute role etc..) [Discord-made & Web-Gui-made ?]
- Token scanner (check for token in messages [& reset them ?])
- Configuration converter (switching between configuration version without losing data)
- Saving configuration & permission history | Backup possible, no implemented user-wise yet
- Auto moderation
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
- SendDM
- Slap
- Welcome
- Lockdown?

### Fixes:

- None

### Deployment

Build Image
```bash
  git clone https://github.com/ulysse-gen/toby-bot
  cd toby-bot
  docker build -t tobybot:4.0.0 .
```

Normal Deployment:
```bash
  git clone https://github.com/ulysse-gen/toby-bot
  cd toby-bot
  docker-compose up -d
```

Fast Deployment:
```bash
  git clone https://github.com/ulysse-gen/toby-bot && cd toby-bot && docker-compose up -d
```