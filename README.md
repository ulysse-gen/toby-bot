# Toby Bot

Toby Bot v4 is on its way, rebuilding from the ground up.

## Inside things:

- Switch to TypeScript + Make Types + Import types to managers - WIP
- Improve storage (Snowflakes?, Change Database engine?, such things)

## Todo, Commands, Ideas & Fixes :

### Todo:

- Auto setup (auto grab log channels, mute role etc..) [Discord-made & Web-Gui-made ?]
- Token scanner (check for token in messages [& reset them ?])
- Configuration converter (switching between configuration version without losing data)
- Saving configuration & permission history | Backup possible, no implemented user-wise yet
- Auto moderation
- Changelog of some kind (& update alert in channel?)
- Command cooldowns
- Reply function to fun commands (ex: embedfail, hi, slap, kiss, hug)
- Make translations for fun commands (ex: embedfail, hi, slap, kiss, hug, welcome)
- WebGUI Notifications
- Channel tool (Rename, permission tool (copy paste perms, backup perms etc)) + commands for permission copy paste

### Commands:

- Autokick?
- Choose
- Coinflip
- Invitelink?
- Makeembed?
- Remindme?
- Rockpaperscissors?
- Rolldice?
- SendDM
- Lockdown?

### Fixes:

- Fix and reactivate slash commands

## Environment variables:
```
MARIADB_HOST (Default: 'MariaDB-TobyBot')     : The database container's name/hostname.
MARIADB_DATABASE_NC (Default: 'tobybot-v4')   : The database name.
MARIADB_CONNECTION_LIMIT (Default: 10)        : The amount of connections to be created in the pool.
MARIADB_ROOT_PASSWORD (Default: none)         : The root password for the database.

TOBYBOT_API_PORT (Default: 6845)              : The port to be used for the API.
TOBYBOT_API_ONLY (Default: false)             : Run only the API and ignore everything else.
TOBYBOT_API_SECRET (Default: none)            : The secret to be used by JWT on the API.

OPENAI_EMAIL (Default: none)                  : The email for the OpenAI account for the ChatGPT fonctions.
OPENAI_PASSWORD (Default: none)               : The password for the OpenAI account for the ChatGPT fonctions.

VUE_APP_TOBYBOT_API_HOST (Default: 'TobyBot') : The API container's name/hostname.
VUE_APP_TOBYBOT_API_PORT (Default: 6845)      : The port to be used for the API.
VUE_APP_OAUTH2_CLIENT_ID (Default: none)      : The ClientID of the bot.

OAUTH2_CLIENT_SECRET (Default: none)          : The Client Secret of the bot.
```

## .env Placeholder
```
MARIADB_HOST=MariaDB-TobyBot
MARIADB_DATABASE_NC=tobybot-v4
MARIADB_CONNECTION_LIMIT=10
MARIADB_ROOT_PASSWORD=XXXXXXXXXX

TOBYBOT_API_PORT=6845
TOBYBOT_API_ONLY=false
TOBYBOT_API_SECRET=XXXXXXXXXX

OPENAI_EMAIL=ulysse1704@icloud.com
OPENAI_PASSWORD=fjz7fdw@MWQ6vgq2edc

VUE_APP_TOBYBOT_API_HOST=api.tobybot.xyz
VUE_APP_TOBYBOT_API_PORT=80
VUE_APP_OAUTH2_CLIENT_ID=XXXXXXXXXXXXXXXXXXX

OAUTH2_CLIENT_SECRET=XXXXXXXXXXXXXXX
```