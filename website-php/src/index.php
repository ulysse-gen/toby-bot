<?php
session_start();
require('src/php/classes/Router.php');
require('src/php/classes/Route.php');
$router = (isset($_GET['url'])) ? new Router($_GET['url']) : new Router("/");
$loggedIn = (isset($_SESSION['discord_access_token']) && isset($_SESSION['tobybot_access_token']));
ob_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <link rel="stylesheet" href="/src/css/main.css">
    <link rel="stylesheet" href="/src/css/mobile.css">
    <script src="https://kit.fontawesome.com/7d3cd103b8.js" crossorigin="anonymous"></script>
    <script src="/src/js/libs/jquery-3.6.0.min.js"></script>
    <script src="/src/js/main.js"></script>
    <title>Toby Bot - Web Panel</title>
</head>

<body class="theme-dark">
    <datalist id="members"></datalist>
    <datalist id="roles"></datalist>
    <datalist id="channels"></datalist>
    <datalist id="guilds"></datalist>
    <datalist id="commands"></datalist>
    <section id="toast-notifications">
    </section>
    <header>
        <div id="logo">
            <h1 id="bot-name" hidden>TobyBot</h1>
            <a href="/">
                <div id="top_logo_animated" title="Go back to home page.">
                    <img src="/src/imgs/tobybot_logo_blue_slide.png" class="sliding slide-left" alt="TobyBot logo but in blue">
                    <img src="/src/imgs/tobybot_logo_red_slide.png" class="sliding slide-right" alt="TobyBot logo but in red">
                    <img src="/src/imgs/tobybot_logo.png" alt="TobyBot logo">
                </div>
            </a>
        </div>
        <div id="nav">
            <nav>
                <a href="/home">HOME</a>
                <a href="/documentation">DOCUMENTATION</a>
                <?php if ($loggedIn) { ?>
                    <a href="/logout">LOGOUT</a>
                <?php }else{  ?>
                    <a href="/login">LOGIN</a>
                <?php } ?>
            </nav>
        </div>
    </header>
    <main>
        <?php 
            $router->get('/', function(){
                $loggedIn = (isset($_SESSION['discord_access_token']) && isset($_SESSION['tobybot_access_token']));
                if ($loggedIn){
                    header("location: /home"); 
                    die();
                }
                require('src/views/home-loggedout.php');
            });

            $router->get('/home', function(){ 
                $loggedIn = (isset($_SESSION['discord_access_token']) && isset($_SESSION['tobybot_access_token']));
                if (!$loggedIn){
                    header("location: /login"); 
                    die();
                }
                require('src/views/home.php');
            });

            $router->get('/login', function(){ 
                if (isset($_GET['redirect']))$_SESSION['redirect-to'] = $_GET['redirect'];
                require('src/php/config.inc.php');
                header("location: $discord_Authorize_URL?client_id=".OAUTH2_CLIENT_ID."&scope=identify%20email%20guilds%20guilds.members.read&response_type=code&prompt=consent&redirect_uri=$website_Base_Url/login/next"); 
            });

            $router->get('/login/next', function() {
                require('src/php/scripts/login.php');
            });

            $router->get('/documentation', function(){ 
                require('src/views/documentation/documentation.php');
            });

            $router->get('/documentation/configurations', function(){ 
                require('src/views/documentation/configurations.php');
            });

            $router->get('/documentation/configurations/guild', function(){ 
                require('src/views/documentation/configuration-guild.php');
            });

            $router->get('/documentation/configurations/user', function(){ 
                require('src/views/documentation/configuration-user.php');
            });

            $router->get('/documentation/configurations/system', function(){ 
                require('src/views/documentation/configuration-system.php');
            });

            $router->get('/logout', function() {
                require('src/php/scripts/logout.php');
            });

            $router->get('/manage', function() {
                header("location: /home"); 
            });

            $router->get('/manage/me', function() {
                $loggedIn = (isset($_SESSION['discord_access_token']) && isset($_SESSION['tobybot_access_token']));
                if (!$loggedIn){
                    header("location: /login?redirect=".$_SERVER['REQUEST_URI']);
                    die();
                }
                require('src/views/manage-user.php');
            });

            $router->get('/manage/bot', function() {
                $loggedIn = (isset($_SESSION['discord_access_token']) && isset($_SESSION['tobybot_access_token']));
                if (!$loggedIn){
                    header("location: /login?redirect=".$_SERVER['REQUEST_URI']);
                    die();
                }
                require('src/views/manage-bot.php');
            });

            $router->get('/manage/:guildId', function($guildId) {
                $loggedIn = (isset($_SESSION['discord_access_token']) && isset($_SESSION['tobybot_access_token']));
                if (!$loggedIn){
                    header("location: /login?redirect=".$_SERVER['REQUEST_URI']);
                    die();
                }
                require('src/views/manage-guild.php');
            });

            $router->run();
            ob_end_flush();

            if (isset($_GET['toast']))echo "<script>makeToastNotify('".((isset($_GET['toast-title'])) ? $_GET['toast-title'] : '')."', '".((isset($_GET['toast-description'])) ? $_GET['toast-description'] : '')."', '".((isset($_GET['toast-type'])) ? $_GET['toast-type'] : 'normal')."')</script>";
        ?>
    </main>
</body>
</html>