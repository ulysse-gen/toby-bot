/////////////////////////////////
//error event handler
/////////////////////////////////

//Importing classes
const { ErrorBuilder } = require('/app/src/classes/Errors');
const FileLogger = require('/app/src/classes/FileLogger');

//Creating objects
const MainLog = new FileLogger();

module.exports = {
    name: 'error',
    once: false,
    async exec(TobyBot, code) {
        throw new ErrorBuilder(code.toString()).setType('DISCORD_ERROR').logError();
    }
}