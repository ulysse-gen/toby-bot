const removeAccents = require(`remove-accents`);
const leetSpeakConverter = require('../../utils/leet-converter');

module.exports.textContains = (text, word) => {
    let messageText = text.toLowerCase();
    let splitters = [" ", ",", ".", ";", ":", "/", "\\", "-", "_", "+", "*", "="];
    let toTry = [word.toLowerCase(), word.replaceAll(' ', '')];
    let found = false;
    splitters.forEach(splitter => {
        let toAdd = word.split('').join(splitter);
        if (!toTry.includes(toAdd)) toTry.push(toAdd);
        toAdd = word.split('').join(splitter + splitter);
        if (!toTry.includes(toAdd)) toTry.push(toAdd);
        toAdd = word.split('').join(splitter + splitter + splitter);
        if (!toTry.includes(toAdd)) toTry.push(toAdd);
    });
    toTry.forEach(element => {
        let withoutAccents = removeAccents(element);
        if (!toTry.includes(withoutAccents)) toTry.push(withoutAccents);
    });
    toTry.forEach(possibility => {
        if ((new RegExp(this.escapeRegex(possibility))).test(messageText) || (new RegExp(this.escapeRegex(possibility))).test(leetSpeakConverter.convertInputReverse(messageText))) {
            found = true;
            return found;
        }
    });
    return found;
}

module.exports.escapeRegex = (string) => {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}