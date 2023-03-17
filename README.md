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

- Command not showing when logging command denied in console

## Environment variables:
```
MARIADB_HOST (Default: 'MariaDB-TobyBot')     : The database container's name/hostname.
MARIADB_DATABASE_NC (Default: 'tobybot-v4')   : The database name.
MARIADB_CONNECTION_LIMIT (Default: 10)        : The amount of connections to be created in the pool.
MARIADB_ROOT_PASSWORD (Default: none)         : The root password for the database.

TOBYBOT_API_HOST (Default: 'TobyBot')         : The API container's name/hostname.
VUE_APP_TOBYBOT_API_HOST (Default: 'TobyBot') : The API container's name/hostname.
TOBYBOT_API_PORT (Default: 6845)              : The port to be used for the API.
VUE_APP_TOBYBOT_API_PORT (Default: 6845)      : The port to be used for the API.
TOBYBOT_API_ONLY (Default: false)             : Run only the API and ignore everything else.
TOBYBOT_API_SECRET (Default: none)            : The secret to be used by JWT on the API.

OPENAI_EMAIL (Default: none)                  : The email for the OpenAI account for the ChatGPT fonctions.
OPENAI_PASSWORD (Default: none)               : The password for the OpenAI account for the ChatGPT fonctions.

VUE_APP_OAUTH2_CLIENT_ID (Default: none)      : The ClientID Of the bot.
```

## .env Placeholder
```
MARIADB_HOST=MariaDB-TobyBot
MARIADB_DATABASE_NC=tobybot-v4
MARIADB_CONNECTION_LIMIT=10
MARIADB_ROOT_PASSWORD=XXXXXXXXXXXXXXXXXXXX

TOBYBOT_API_HOST=TobyBot
TOBYBOT_API_PORT=6845
TOBYBOT_API_ONLY=false
TOBYBOT_API_SECRET=XXXXXXXXXXXXXXXXXXXX

OPENAI_EMAIL=XXXXXXXXXXXXXXXXXXXX
OPENAI_PASSWORD=XXXXXXXXXXXXXXXXXXXX

VUE_APP_TOBYBOT_API_HOST=TobyBot
VUE_APP_TOBYBOT_API_PORT=6845
VUE_APP_OAUTH2_CLIENT_ID=XXXXXXXXXXXXXXXX
```