<?php
function apiRequest($url, $post=Array(), $headers=Array()) {
    $headers[] = 'Accept: application/json';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

    if ($post && !empty($post)){
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
    }

    return json_decode(curl_exec($ch));
}

function tobybotApiRequest($endpoint, $post=Array(), $headers=Array()) {
    if(isset($_SESSION['tobybot_access_token']))$headers[] = 'Authorization: Bearer ' . $_SESSION['tobybot_access_token'];
    return apiRequest("http://" . $_ENV["TOBYBOT_API_HOST"] . ":" . $_ENV["TOBYBOT_API_PORT"] . $endpoint, $post, $headers);
}

function discordApiRequest($url, $post=Array(), $headers=Array()) {
    if(isset($_SESSION['discord_access_token']))$headers[] = 'Authorization: Bearer ' . $_SESSION['discord_access_token'];
    return apiRequest($url, $post, $headers);
}

function tobybotApiRequest_AsWebsite($endpoint, $post=Array(), $headers=Array()) {
    $headers[] = 'Authorization: Bearer ' . TOBYBOT_SECRET;
    return apiRequest("http://" . $_ENV["TOBYBOT_API_HOST"] . ":" . $_ENV["TOBYBOT_API_PORT"] . $endpoint, $post, $headers);
}

function get($key, $default=NULL) {
    return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
}

function session($key, $default=NULL) {
    return array_key_exists($key, $_SESSION) ? $_SESSION[$key] : $default;
}
?>