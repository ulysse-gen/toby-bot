let Guilds = [];
let Commands = [];
let Channels = {};
let Members = {};
let Roles = {};

function makeToastNotify(title, description, type = 'normal', timeOnScreen = 11000) {
    let notify = $(document.createElement('div')).addClass('notify').addClass(type);
    let disapearTimeout = setTimeout(() => {
        notify.addClass('goAway');
        setTimeout(() => {
            notify.remove();
        }, 1200);
    }, timeOnScreen);
    notify.append($(document.createElement('span')).addClass('clearNotify').html("X")).on('click', ()=>{
        clearTimeout(disapearTimeout);
        notify.addClass('goAway');
        setTimeout(() => {
            notify.remove();
        }, 1200);
    });
    notify.append($(document.createElement('span')).addClass('title').html(title));
    notify.append($(document.createElement('span')).addClass('description').html(description));
    $('#toast-notifications').append(notify);
    
}

function showSuccess(title, text) {
    makeToastNotify(title, text, 'positive');
}

function showError(title, text) {
    makeToastNotify(title, text, 'danger');
}

async function makeDatalist(name, data, display = "name", id = "id") {
    let datalist = $(`datalist#`+name);
    datalist.html('');
    for (const dataEntry of data) {
        datalist.append($(document.createElement('option')).val(dataEntry[id]).html(dataEntry[display]));
    }
}