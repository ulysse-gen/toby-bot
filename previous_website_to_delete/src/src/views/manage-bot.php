<?php 
require_once('src/php/config.inc.php');
?>
<link rel="stylesheet" href="/src/css/manage/main.css">
<script src="/src/js/manage.js"></script>
<script src="/src/js/configuration.js"></script>
<section class="full-width bot-details">
    <h2 class="section-title">Managing <span class="bot-name" id="botName">TobyBot</span></h1>
</section>

<section class="half-width bot-config">
    <h2 class="section-title">Bot configuration</h1>
    <p class="section-description">Adjust your configuration here :</p>

    <div id="configuration-zone" class="configuration">

    </div>
</section>

<script>
    const apiHost = "<?php echo $_ENV["TOBYBOT_API_HOST"]; ?>";
    const apiPort = <?php echo $_ENV["TOBYBOT_API_PORT"]; ?>;
    var apiBase = `https://${apiHost}:${apiPort}`;
    apiBase = `${location.protocol}//${location.hostname}:${apiPort}`;


    async function getConfigurationThenMakeIt(dontNotify = false) {
        let configuration = await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/system/configuration/`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                if (!dontNotify)showSuccess("Successfully loaded configuration.");
            },
            error: (data) => {
                if (data.status == 403){
                    return window.location = "/home?toast=true&toast-title=Cannot manage the bot.&toast-description=You are not allowed to manage the bot.&toast-type=danger";
                }
                if (data.responseJSON.error == true){
                    showError(data.responseJSON.title, data.responseJSON.text);
                }
            }
        });
        let documentation = await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/documentation/configuration/system`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`}
        });
        makeConfiguration(documentation, configuration);
    }

    function loadGuilds() {
        $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Guilds = data;
                makeDatalist('guilds', Guilds.map(guild=>guild.guild));
            }
        });
    }

    function saveConfiguration(path, value) {
        $.ajax({
            type: 'PATCH',
            url: `${apiBase}/v1/system/configuration/${path}`,
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

    loadGuilds();
    getConfigurationThenMakeIt(true);

    $(document).on('change', 'input#communityGuild', async (el) => {
        await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/`+el.currentTarget.value+`/channels`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Channels[el.currentTarget.value] = data;
                makeDatalist('channels', Channels[el.currentTarget.value].filter(channel => channel.type == "GUILD_TEXT"));
            },
            error: (error) => {
                if (error.status == 404){
                    return showError("Could not fetch channels.", error.responseJSON);
                }
            }
        });
        await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/`+el.currentTarget.value+`/members`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Members[el.currentTarget.value] = data;
                makeDatalist('members', Members[el.currentTarget.value], 'tag');
            },
            error: (error) => {
                if (error.status == 404){
                    return showError("Could not fetch members.", error.responseJSON);
                }
            }
        });
        await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/guilds/`+el.currentTarget.value+`/roles`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                Roles[el.currentTarget.value] = data;
                makeDatalist('roles', Roles[el.currentTarget.value]);
            },
            error: (error) => {
                if (error.status == 404){
                    return showError("Could not fetch roles.", error.responseJSON);
                }
            }
        });
});
</script>