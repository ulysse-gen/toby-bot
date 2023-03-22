<?php
require_once('src/php/config.inc.php');
$configurationDocumentation = tobybotApiRequest("/v1/documentation/configuration/guild");
print_r($configurationDocumentation);
?>
<link rel="stylesheet" href="/src/css/documentation/main.css">
<section class="full-width documentation">
    <h2 class="section-title">Guild configuration</h1>
    <p class="section-description">The commands for guild configuration is `configuration`, it is accessible thru slash commands as well as normal commands using the bot prefix.<br />
    <span class="space-from-line-above">It affects the guild is has been executed in. You can user it as :</span><br />
    <span class="code-font">configuration view &#60;configuration key&#62;<br />
    configuration reset &#60;configuration key&#62;<br />
    configuration set &#60;configuration key&#62; &#60;value&#62;</span></p>
    <br /><br />
    <div class="documentation">
    <?php configToInput($configurationDocumentation); ?>
    </div>
</section>

<?php 
function configToInput($documentation, $subPath = "", $embeded = 0) {
    foreach ($documentation as $key => $value) {
        $path = (($subPath == "") ? "" : "$subPath.")."$key";
        if (is_object($documentation->$key) && (property_exists($documentation->$key, 'name') && property_exists($documentation->$key, 'description') && property_exists($documentation->$key, 'type') && property_exists($documentation->$key, 'editable') && property_exists($documentation->$key, 'default'))){
            echo "<div class='documentation-entry' id='$path'>";
            echo "<div class='infos'><span class='name'>".$documentation->$key->name."</span><span class='description'>".$documentation->$key->description."</span></div>";
            echo "<div class='details'>";
            echo "<span class='type'><span class='type-string'>Type: ".$documentation->$key->type."</span><span class='type-text'>".makeType($documentation->$key->type)."</span></span>";
            echo "<span class='default-value'>Default value: ".makeDefaultValue($documentation->$key->type, $documentation->$key->default)."</span>";
            echo "<span class='editable'>".($documentation->$key->editable) ? "" : "I dont even know why you're looking there, this is not even editable."."</span>";
            echo "</div></div>";
        }else if (is_object($documentation->$key)){
            configToInput($documentation->$key, (($subPath == "") ? "" : "$subPath.")."$key", $embeded+1);
        }
    }
}

function makeType($type) {
    if (str_starts_with($type, 'String')){
        if ($type == "String"){
            return "This is just text ! Type whatever you want !";
        }
        if ($type == "String(Color)"){
            return "You must type here a color. It must be an HEX color, you can make them at <a href='https://htmlcolorcodes.com/' target='_blank'>https://htmlcolorcodes.com/</a> or straight from the management panel.";
        }
        if ($type == "String(ChannelId)"){
            return "You must type here a channel ID, you can get it by right clicking any channel with <a class='hidden-link-unless-hover' href='https://www.google.com/search?q=discord+enable+developer+mode' target='_blank'>developper mode on</a>.";
        }
        if ($type == "String(RoleID)"){
            return "You must type here a role ID, you can get it by right clicking any role with <a class='hidden-link-unless-hover' href='https://www.google.com/search?q=discord+enable+developer+mode' target='_blank'>developper mode on</a>.";
        }
        if ($type == "String(UserID)"){
            return "You must type here a user ID, you can get it by right clicking any user with <a class='hidden-link-unless-hover' href='https://www.google.com/search?q=discord+enable+developer+mode' target='_blank'>developper mode on</a>.";
        }
        if ($type == "String(token)"){
            return "This must be a valable token.";
        }
    } else if (str_starts_with($type, 'Object')){
        if ($type == "Object(Array)"){
            return "This is an array, you must type in a valid JSON or use the management panel. You might find the use of <a href='https://wtools.io/convert-list-to-json-array' target='_blank'>this tool</a>.";
        }
    }else if ($type == "Boolean"){
        return "Just a simple yes/no. Possible responses for Boolean parsing are: <br />`true` as true, yes, oui, y, o, 1<br />`false` as false, no, non, n, 0";
    }
}

function makeDefaultValue($type, $default) {
    if (str_starts_with($type, 'String')){
        return $default;
    } else if (str_starts_with($type, 'Object')){
        return json_encode($default);
    }else if ($type == "Boolean"){
        return ($default) ? 'true' : 'false';
    }
}
?>

<script>
    if(window.location.hash) {
        $(window.location.hash.replaceAll('.', '\\.')).addClass('focused-entry');
    }
</script>