# Toby Bot

Toby Bot v4 is on its way, rebuilding from the ground up.

## Inside things:

- GuildManager, UserManager, Guild, User extending original Discord's managers

## Todo, Commands, Ideas & Fixes :

### Todo:

- Web GUI (gosh i suck at making GUIs i swear..) | On its way!
    - Well in fact I have to rebuild a bit part of it cuz of the changes i did lol
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

- Nothin'

## Environment variables:
```
MARIADB_HOST (Default: 'MariaDB-TobyBot'): The database container's name/hostname.
MARIADB_DATABASE_NC (Default: 'tobybot-v4') : The database name.
MARIADB_CONNECTION_LIMIT (Default: 10)   : The amount of connections to be created in the pool.
MARIADB_ROOT_PASSWORD (Default: none)    : The root password for the database.

TOBYBOT_API_HOST (Default: 'TobyBot')    : The API container's name/hostname.
TOBYBOT_API_PORT (Default: 6845)         : The port to be used for the API.
TOBYBOT_API_ONLY (Default: false)        : Run only the API and ignore everything else.
TOBYBOT_API_SECRET (Default: none)       : The secret to be used by JWT on the API.
```