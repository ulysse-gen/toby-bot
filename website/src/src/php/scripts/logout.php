<?php 
require('src/php/config.inc.php');
$ch = curl_init($discord_Revoke_URL);
curl_setopt_array($ch, array(
    CURLOPT_POST => TRUE,
    CURLOPT_RETURNTRANSFER => TRUE,
    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    CURLOPT_HTTPHEADER => array('Content-Type: application/x-www-form-urlencoded'),
    CURLOPT_POSTFIELDS => http_build_query(array(
        'token' => $_SESSION['discord_access_token'],
        'token_type_hint' => 'access_token',
        'client_id' => OAUTH2_CLIENT_ID,
        'client_secret' => OAUTH2_CLIENT_SECRET,
      )),
));
$response = curl_exec($ch);
/*$ch = curl_init($tobybot_Revoke_URL);
curl_setopt_array($ch, array(
    CURLOPT_POST => TRUE,
    CURLOPT_RETURNTRANSFER => TRUE,
    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    CURLOPT_HTTPHEADER => array('Content-Type: application/x-www-form-urlencoded'),
    CURLOPT_POSTFIELDS => http_build_query(array(
        'token' => $_SESSION['discord_access_token'],
        'token_type_hint' => 'access_token',
        'client_id' => OAUTH2_CLIENT_ID,
        'client_secret' => OAUTH2_CLIENT_SECRET,
      )),
));
$response = curl_exec($ch);*/
session_destroy();
header('Location: /');
die();
?>