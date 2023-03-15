<?php
require('src/php/functions.php');

$dev = true;

$SQLHost = $_ENV["MARIADB_HOST"];
$SQLUser = "root";
$SQLPass = $_ENV["MARIADB_ROOT_PASSWORD"];
$SQLDatabase = $_ENV["MARIADB_DATABASE_NC"];

$discord_Api_Base = 'https://discord.com/api';
$discord_Authorize_URL = $discord_Api_Base.'/oauth2/authorize';
$discord_Token_URL = $discord_Api_Base.'/oauth2/token';
$discord_Revoke_URL = $discord_Api_Base.'/oauth2/token/revoke';

$discord_Authorize_Scopes = Array('email', 'guilds');

$website_Base_Url = stripos($_SERVER['SERVER_PROTOCOL'],'https') === 0 ? 'https://' : 'http://' . $_SERVER['HTTP_HOST'];

$application_Id = ($dev) ? '933936295074480208' : '933695613294501888';
$application_Secret = ($dev) ? '3n-Umv8MpO8I7Gwv-IMben1WS1VVrSWg' : 'fZ-hJ26ev-DcQLR5pqzaT6MpGAwtRea0';

$tobybot_Api_Secret = $_ENV["TOBYBOT_API_SECRET"];

define('OAUTH2_CLIENT_ID', $application_Id);
define('OAUTH2_CLIENT_SECRET', $application_Secret);
define('TOBYBOT_SECRET', $tobybot_Api_Secret);
?>