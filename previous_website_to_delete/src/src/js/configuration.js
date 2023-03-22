let ObjectsAndArrays = {
    Objects: {},
    Arrays: {}
};

function makeConfiguration(documentation, configuration, subPath = "", embeded = 0) {
    for (const key in configuration) {
        let value = configuration[key];
        let path = ((subPath == "") ? "" : `${subPath}.`) + key;

        if (typeof documentation[key] != "undefined") {
            if ((typeof documentation[key] == "object" && !Array.isArray(documentation[key])) && (typeof documentation[key].name == "undefined" && typeof documentation[key].description == "undefined" && typeof documentation[key].type == "undefined" && typeof documentation[key].editable == "undefined" && typeof documentation[key].default == "undefined")){
                makeConfiguration(documentation[key], configuration[key], path, embeded+1);
            }else if (documentation[key].type.startsWith("String")) {
                if (documentation[key].type == "String(Color)"){
                    makeColorInput(documentation[key], key, value, path);
                }else if (documentation[key].type == "String(ChannelId)"){
                    makeChannelInput(documentation[key], key, value, path);
                } else if (documentation[key].type == "String(UserId)"){
                    makeMemberInput(documentation[key], key, value, path);
                } else if (documentation[key].type == "String(RoleId)"){
                    makeRoleInput(documentation[key], key, value, path);
                } else if (documentation[key].type == "String(GuildId)"){
                    makeGuildInput(documentation[key], key, value, path);
                }else {
                    makeStringInput(documentation[key], key, value, path);
                }
            }else if (documentation[key].type.startsWith("Object")){
                if (documentation[key].type == "Object(Array)"){
                    makeArrayInput(documentation[key], key, value, path);
                }
            }else if (documentation[key].type.startsWith("Boolean")){
                makeBooleanInput(documentation[key], key, value, path);
            }
        }
    }
}

function makeStringInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("string-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    SettingInputs.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "text").val(value));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("SAVE").on('click', () => {
        saveConfiguration(path, $(`#${path.replaceAll('.', '\\.')}`).val());
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeColorInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("color-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    SettingInputs.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "color").val(value));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("SAVE").on('click', () => {
        saveConfiguration(path, $(`#${path.replaceAll('.', '\\.')}`).val());
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeMemberInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("member-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    SettingInputs.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "list").attr("list", "members").val(value));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("SAVE").on('click', () => {
        saveConfiguration(path, $(`#${path.replaceAll('.', '\\.')}`).val());
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeRoleInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("role-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    SettingInputs.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "list").attr("list", "roles").val(value));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("SAVE").on('click', () => {
        saveConfiguration(path, $(`#${path.replaceAll('.', '\\.')}`).val());
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeGuildInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("guild-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    SettingInputs.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "list").attr("list", "guilds").val(value));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("SAVE").on('click', () => {
        saveConfiguration(path, $(`#${path.replaceAll('.', '\\.')}`).val());
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeChannelInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("channel-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    SettingInputs.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "list").attr("list", "channels").val(value));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("SAVE").on('click', () => {
        saveConfiguration(path, $(`#${path.replaceAll('.', '\\.')}`).val());
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeBooleanInput(documentation, key, value, path) {
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("boolean-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    let SettingCheckbox = $(document.createElement("div")).addClass("checkbox");
    SettingCheckbox.append($(document.createElement("input")).addClass("input").attr("id", path).attr("type", "checkbox").attr("checked", value)).on('change', () => {
        let value = $(`#${path.replaceAll('.', '\\.')}`).is(":checked");
        $('.checkmark', SettingInputs).html((value) ? 'Enabled' : 'Disabled');
        saveConfiguration(path, value);
    });
    SettingCheckbox.append($(document.createElement("div")).addClass("checkmark").html((value) ? 'Enabled' : 'Disabled'));
    SettingInputs.append(SettingCheckbox);
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

function makeArrayInput(documentation, key, value, path) {
    ObjectsAndArrays.Arrays[path] = value;
    let SettingInput = $(document.createElement("div")).addClass("setting-input").addClass("array-input");
    let SettingInfos = $(document.createElement("div")).addClass("infos").append($(document.createElement("span")).addClass("name").html(documentation.name)).append($(document.createElement("span")).addClass("description").html(documentation.description));
    let SettingInputs = $(document.createElement("div")).addClass("inputs");
    let EntriesList = $(document.createElement("div")).addClass("array").attr("id", path);
    for (const entry of value) {
        let ArrayEntry = $(document.createElement("div")).addClass("arrayEntry");
        ArrayEntry.append($(document.createElement("input")).addClass("input").attr("type", "text").val(entry));
        ArrayEntry.append($(document.createElement("button")).addClass("danger-button").addClass("outline-button").addClass("deleteFromArray").html("X"));
        EntriesList.append(ArrayEntry);
    }
    SettingInputs.append(EntriesList);
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("outline-button").addClass("addToArray").html("Add new entry").on('click', () => {
        let ArrayEntry = $(document.createElement("div")).addClass("arrayEntry");
        ArrayEntry.append($(document.createElement("input")).addClass("input").attr("type", "text").val("New entry"));
        ArrayEntry.append($(document.createElement("button")).addClass("danger-button").addClass("outline-button").addClass("deleteFromArray").html("X"));
        EntriesList.append(ArrayEntry);
    }));
    SettingInputs.append($(document.createElement("button")).addClass("positive-button").addClass("save").html("Save").on('click', () => {
        let tempNewArray = [];
        for (const entry of EntriesList.children('div.arrayEntry')) {
            tempNewArray.push($('input', entry).val());
        }
        ObjectsAndArrays.Arrays[path] = tempNewArray;
        saveConfiguration(path, JSON.stringify(ObjectsAndArrays.Arrays[path]));
    }));
    $("#configuration-zone").append(SettingInput.append(SettingInfos).append(SettingInputs));
}

$(document).on('click', '.deleteFromArray', (el) => {
    let parent = $(el.target).parent().parent();
    let path = parent.attr('id');
    $(el.target).parent().remove();
    let HTMLEntries = parent.children('div.arrayEntry');
    let tempNewArray = [];
    for (const entry of HTMLEntries) {
        tempNewArray.push($('input', entry).val());
    }
    ObjectsAndArrays.Arrays[path] = tempNewArray;
});