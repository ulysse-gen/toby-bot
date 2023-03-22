<?php
require('src/php/config.inc.php');
if (!isset($_GET['code'])){
    header("location: /home");
    die();
}


$_SESSION['discord_access_token'] = discordApiRequest($discord_Token_URL, array(
    "grant_type" => "authorization_code",
    'client_id' => OAUTH2_CLIENT_ID,
    'client_secret' => OAUTH2_CLIENT_SECRET,
    'redirect_uri' => $website_Base_Url."/login/next",
    'code' => $_GET['code']
))->access_token;
$_SESSION['tobybot_access_token'] = tobybotApiRequest('/v1/users/authByDiscordToken', array('discordToken' => $_SESSION['discord_access_token']));
print_r($_SESSION['tobybot_access_token']);
$_SESSION['discord_guilds'] = discordApiRequest("$discord_Api_Base/users/@me/guilds");

$_SESSION['tobybot_user'] = tobybotApiRequest('/v1/users/me');

if ($_SESSION['tobybot_user'] == "You dont have the permission to access this."){
    session_destroy();
    header('location: /?toast=true&toast-title=You do not have access to this.&toast-description=You are not allowed to use the web panel.&toast-type=danger');
    die();
}

echo "<script>sessionStorage.setItem('discord_access_token', '".$_SESSION['discord_access_token']."'); sessionStorage.setItem('tobybot_access_token', '".$_SESSION['tobybot_access_token']."');</script>";


$redirectTo = "/home";
if (isset($_GET['redirect']))$_SESSION['redirect-to'] = $_GET['redirect'];
if (isset($_SESSION['redirect-to'])){
    $redirectTo = $_SESSION['redirect-to'];
    unset($_SESSION['redirect-to']); 
}


header( "Refresh:0.3; url='$redirectTo'");
die();
?>