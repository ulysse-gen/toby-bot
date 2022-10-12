<?php 
require_once('src/php/config.inc.php');

$_SESSION['tobybot_user'] = tobybotApiRequest("/v1/users/me");

if ($_SESSION['tobybot_user'] == "Token required."){
    header("location: /login?redirect=".$_SERVER['REQUEST_URI']);
    die();
}
if ($_SESSION['tobybot_user'] == "You dont have the permission to access this."){
    session_destroy();
    header('location: /?toast=true&toast-title=You do not have access to this.&toast-description=You are not allowed to use the web panel.&toast-type=danger');
    die();
}

$adminAccess = tobybotApiRequest("/v1/system/haspermission/ADMIN");
?>
<link rel="stylesheet" href="/src/css/home/main.css">
<section class="full-width">
    <h2 class="section-title">Welcome <?php echo $_SESSION['tobybot_user']->user->tag ?></h1>
    <p class="section-description justify-text">
        Find down below all you might need to explore, use and configure TobyBot to suit your needs.
    </p>
</section>

<?php 
if (is_bool($adminAccess) && $adminAccess){
?>
    <datalist id="guilds"></datalist><datalist id="channels"></datalist><datalist id="commands"></datalist>
    <script>
        const apiHost = "<?php echo $_ENV["TOBYBOT_API_HOST"]; ?>";
        const apiPort = <?php echo $_ENV["TOBYBOT_API_PORT"]; ?>;
        var apiBase = `https://${apiHost}:${apiPort}`;
        apiBase = `${location.protocol}//${location.hostname}:${apiPort}`;
    </script>
    <link rel="stylesheet" href="/src/css/home/admin.css">
    <script src="/src/js/admin.js" type="module"></script>
    <section class="full-width admin-panel">
    <h2 class="section-title">Admin panel</h1>
    <div class="bot-details">
        <span class="title">Bot status:</span>
        <span class="uptime" id="uptime">Uptime: <span class="detail-value">Loading</span></span>
        <div class="cached">
            <span id="cachedUsers">Cached users: <span class="detail-value">Loading</span></span>
            <span id="cachedChannels">Cached channels: <span class="detail-value">Loading</span></span>
            <span id="totalGuilds">Total guilds: <span class="detail-value">Loading</span></span>
        </div>
    </div>
    <div class="command-execution">
        <span class="title">Command execution:</span>
        <div class="command-input guild-input">
            <span class="name">Guild:</span>
            <div class="inputs">
                <input id="commandExecutionGuildInput" type="list" list="guilds">
            </div>
        </div>
        <div class="command-input channel-input">
            <span class="name">Channel:</span>
            <div class="inputs">
                <input id="commandExecutionChannelInput" type="list" list="channels">
            </div>
        </div>
        <div class="command-input command-input">
            <span class="name">Command:</span>
            <div class="inputs">
                <input id="commandExecutionCommandInput" type="list" list="commands">
            </div>
        </div>
        <div class="command-input array-input">
            <span class="name">Arguments:</span>
            <div class="inputs">
                <div class="array" id="commandExecutionCommandArgumentsInput"></div>
                <button class="positive-button outline-button addToArray">Add new entry</button>
            </div>
        </div>
        <button class="danger-button execute" id="commandExecutionExecute">Execute</button>
    </div>
</section>
<?php } ?>

<section class="full-width">
    <h2 class="section-title">Servers you're in (<?php echo count($_SESSION['discord_guilds']); ?> servers) : </h1>
    <p class="section-description justify-text">
        Here is a list of all the servers you're in. You can click on any of them to start configuring them.
        <span class="space-from-line-above">If I am not in the server, you will be prompted to invite me in it.</span>
    </p>

    <div class="servers-list">
            <?php foreach ($_SESSION['discord_guilds'] as $guild => $value): ?>
            <a href="/manage/<?php echo $value->id; ?>/" class="server-link hidden-link">
                <div class="server">
                    <img src="<?php echo (isset($value->icon)) ? "https://cdn.discordapp.com/icons/$value->id/$value->icon.webp" : "https://ui-avatars.com/api/?name=$value->name&background=202020&color=ffffff" ?>" alt="<?php echo $value->name; ?>'s server picture">
                    <span class="name"><?php echo $value->name; ?></span>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
</section>