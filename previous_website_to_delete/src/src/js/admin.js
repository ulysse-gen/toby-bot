import prettyMilliseconds from './libs/pretty-ms.js';

let status = await getStatus();
updateStatus();
getGuilds();
getCommands();


async function updateStatus() {
    setInterval(async () => {
        status = await getStatus();
    }, 15000);
    setInterval(() => {
        if (status.status == "running"){
            status.uptime += 1000;
            $("#uptime > span").html(prettyMilliseconds(status.uptime, {secondsDecimalDigits: 0}));
            $("#totalGuilds > span").html(status.totalGuilds);
            $("#cachedChannels > span").html(status.cachedChannels);
            $("#cachedUsers > span").html(status.cachedUsers);
        }else {
            $("#uptime > span").html("The bot is not currently running.");
        }
    }, 1000);
}

async function getStatus() {
    return $.ajax({
        type: 'GET',
        url: `${apiBase}/v1/system/status/detailed/`,
        headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`}
    });
}

async function getGuilds() {
    return $.ajax({
        type: 'GET',
        url: `${apiBase}/v1/guilds`,
        headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
        success: (data) => {
            Guilds = data;
            return makeDatalist('guilds', Guilds.map(guild => guild.guild));
        }
    });
}

async function getCommands() {
    return $.ajax({
        type: 'GET',
        url: `${apiBase}/v1/commands`,
        headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
        success: (data) => {
            Commands = data;
            return makeDatalist('commands', Commands, "title", "name");
        }
    });
}

$("input#commandExecutionGuildInput").on('change', async (el) => {
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

$(document).on('click', '.deleteFromArray', (el) => {
    $(el.target).parent().remove();
});

$(document).on('click', '.addToArray', (el) => {
    let parent = $(el.target).parent();
    let HTMLEntries = parent.children('div.array');
    let ArrayEntry = $(document.createElement("div")).addClass("arrayEntry");
    ArrayEntry.append($(document.createElement("input")).addClass("input").attr("type", "text").val("New entry"));
    ArrayEntry.append($(document.createElement("button")).addClass("danger-button").addClass("outline-button").addClass("deleteFromArray").html("X"));
    HTMLEntries.append(ArrayEntry);
});

$(document).on('click', '#commandExecutionExecute', (el) => {
    let guild = $("input#commandExecutionGuildInput").val();
    let channel = $("input#commandExecutionChannelInput").val();
    let command = $("input#commandExecutionCommandInput").val();
    let HTMLEntries = $('div#commandExecutionCommandArgumentsInput').children();
    let args = [];
    for (const entry of HTMLEntries) {
        args.push($('input', entry).val());
    }
    execCommand(guild, channel, command, args);
});

async function execCommand(guildId, channelId, command, args) {
    return $.ajax({
        type: 'POST',
        url: `${apiBase}/v1/commands/${command}/execute`,
        headers: {"Authorization": `Bearer ${sessionStorage.getItem('tobybot_access_token')}`},
        data: {guildId: guildId, channelId: channelId, options: args.join(' ')},
        success: (data) => {
            showSuccess("Command executed successfully.");
        },
        error: (data) => {
            showError("Could not execute", data.responseJSON);
        }
    });
}

function showSuccess(title, text) {
    makeToastNotify(title, text, 'positive');
}

function showError(title, text) {
    makeToastNotify(title, text, 'danger');
}