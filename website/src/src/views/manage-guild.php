<?php 
require_once('src/php/config.inc.php');
?>
<link rel="stylesheet" href="/src/css/manage/main.css">
<script src="/src/js/manage.js"></script>
<script src="/src/js/configuration.js"></script>
<section class="full-width server-details">
    <h2 class="section-title">Managing <span class="server-name" id="guildName"></span></h1>

    <div class="guild-stats">
        <span class="stats-entry" id="guildMembersCount"><span class="stats-name">Members</span>: <span class="stats-value">Loading</span></span>
        <span class="stats-entry" id="guildChannelsCount"><span class="stats-name">Channels</span>: <span class="stats-value">Loading</span></span>
        <span class="stats-entry" id="guildRolesCount"><span class="stats-name">Roles</span>: <span class="stats-value">Loading</span></span>
        <span class="stats-entry" id="guildBansCount"><span class="stats-name">Bans</span>: <span class="stats-value">Loading</span></span>
        <span class="stats-entry" id="guildEmojisCount"><span class="stats-name">Emojis</span>: <span class="stats-value">Loading</span></span>
        <span class="stats-entry" id="guildStickersCount"><span class="stats-name">Stickers</span>: <span class="stats-value">Loading</span></span>
        <span class="stats-entry" id="guildBoostersCount"><span class="stats-name">Boosters</span>: <span class="stats-value">Loading</span>
    </div>
</section>

<section class="half-width server-config">
    <h2 class="section-title">Server configuration</h1>
    <p class="section-description">Adjust your configuration here :</p>

    <div id="configuration-zone" class="configuration">

    </div>
</section>

<script>
    const apiHost = "<?php echo $_ENV["TOBYBOT_API_HOST"]; ?>";
    const apiPort = <?php echo $_ENV["TOBYBOT_API_PORT"]; ?>;
    var apiBase = `https://${apiHost}:${apiPort}`;
    apiBase = `${location.protocol}//${location.hostname}:${apiPort}`;
    const guildId = "<?php echo $guildId; ?>";


    async function getConfigurationThenMakeIt(dontNotify = false) {
        let configuration = await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/${guildId}/configuration/`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                if (!dontNotify)showSuccess("Successfully loaded configuration.");
            },
            error: (data) => {
                console.log(data);
                if (data.status == 403){
                    return window.location = "/home?toast=true&toast-title=Cannot manage this server.&toast-description=You are not allowed to manage this server.&toast-type=danger";
                }
                if (data.responseJSON.error == true){
                    showError(data.responseJSON.title, data.responseJSON.text);
                }
            }
        });
        let documentation = await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/documentation/configuration/guild`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`}
        });
        makeConfiguration(documentation, configuration);
    }

    function loadGuild() {
        $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/${guildId}/`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Guilds.push(data.guild);
                $("span#guildMembersCount").children('span.stats-value').html(data.guild.members.length)
                $("span#guildBansCount").children('span.stats-value').html(data.guild.bans.length)
                $("span#guildEmojisCount").children('span.stats-value').html(data.guild.emojis.length)
                $("span#guildStickersCount").children('span.stats-value').html(data.guild.stickers.length)
                $("span#guildBoostersCount").children('span.stats-value').html(data.guild.premiumSubscriptionCount)
                $("span#guildName").html(data.guild.name)
            },
            error: (error) => {
                if (error.status == 404){
                    return window.location = "/invite";
                }else if (data.status == 403){
                    return window.location = "/home?toast=true&toast-title=Cannot manage this server.&toast-description=You are not allowed to manage this server.&toast-type=danger";
                }
            }
        });
        loadDatalists();
    }

    function loadDatalists() {
        $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/${guildId}/channels`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Channels[guildId] = data;
                makeDatalist('channels', Channels[guildId]);
                $("span#guildChannelsCount").children('span.stats-value').html(Channels[guildId].length)
            }
        });

        $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/${guildId}/roles`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Roles[guildId] = data;
                makeDatalist('roles', Roles[guildId]);
                $("span#guildRolesCount").children('span.stats-value').html(Roles[guildId].length)
            }
        });
    }

    function saveConfiguration(path, value) {
        $.ajax({
            type: 'PATCH',
            url: `${apiBase}/v1/guilds/${guildId}/configuration/${path}`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            data: {value: value},
            success: (data) => {
                showSuccess("Configuration saved successfully.");
            },
            error: (data) => {
                if (data.responseJSON.error == true){
                    showError(data.responseJSON.title, data.responseJSON.text);
                }
            }
        })
    }

    loadGuild();
    getConfigurationThenMakeIt(true);
</script>