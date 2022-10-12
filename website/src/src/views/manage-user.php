<?php 
require_once('src/php/config.inc.php');
?>
<link rel="stylesheet" href="/src/css/manage/main.css">
<script src="/src/js/manage.js"></script>
<script src="/src/js/configuration.js"></script>
<section class="full-width user-details">
    <h2 class="section-title">Managing <span class="user-name" id="userName"></span></h1>
</section>

<section class="half-width user-config">
    <h2 class="section-title">User configuration</h1>
    <p class="section-description">Adjust your configuration here :</p>

    <div id="configuration-zone" class="configuration">

    </div>
</section>

<script>
    const apiBase = "<?php echo "http://" . $_ENV["TOBYBOT_API_HOST"] . ":" . $_ENV["TOBYBOT_API_PORT"]; ?>";
    const userId = "<?php echo $_SESSION['tobybot_user']->id; ?>";


    async function getConfigurationThenMakeIt(dontNotify = false) {
        let configuration = await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/users/${userId}/configuration/`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                if (!dontNotify)showSuccess("Successfully loaded configuration.");
            },
            error: (data) => {
                if (data.status == 403){
                    return window.location = "/home?toast=true&toast-title=Cannot manage this user.&toast-description=You are not allowed to manage this user.&toast-type=danger";
                }
                if (data.responseJSON.error == true){
                    showError(data.responseJSON.title, data.responseJSON.text);
                }
            }
        });
        let documentation = await $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/documentation/configuration/user`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`}
        });
        makeConfiguration(documentation, configuration);
    }

    function loadUser() {
        $.ajax({
            type: 'GET',
            url: `${apiBase}/v1/users/${userId}/`,
            headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
            success: (data) => {
                $("span#userName").html(data.user.tag)
            },
            error: (error) => {
                if (error.status == 404){
                    return window.location = "/invite";
                }else if (data.status == 403){
                    return window.location = "/home?toast=true&toast-title=Cannot manage this user.&toast-description=You are not allowed to manage this user.&toast-type=danger";
                }
            }
        });
    }

    function saveConfiguration(path, value) {
        $.ajax({
            type: 'PATCH',
            url: `${apiBase}/v1/users/${userId}/configuration/${path}`,
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

    loadUser();
    getConfigurationThenMakeIt(true);
</script>