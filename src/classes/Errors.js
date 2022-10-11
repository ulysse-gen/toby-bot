const colors = require('colors');
const moment = require('moment');

let ErrorType = {
    Unknown: "UNKNOWN_ERROR",
    Type: "TYPE_ERROR",
    MissingArgument: "MISSING_ARG_ERROR",
    CommandExecution: "COMMAND_EXECUTION_ERROR",
    Fatal: "FATAL_ERROR",
    SQL: "SQL_ERROR",
    File: "FILE_ERROR"
}

module.exports.ErrorType = ErrorType;

module.exports.ErrorBuilder = class ErrorBuilder extends Error {

    /**
     * 
     * @param {string} message - The error message
     * @param {object} [options] - Options for the error.
     * @param {Error} options.cause - The error that caused this bullshit. 
     */
    constructor(message, options) {
        super(message, options);

        this.type = ErrorType.Unknown;

        this.handled = "partially lol";
    }

    /**
     * Set the error type
     * @param {string} type - The error type (UNKNOWN_ERROR, TYPE_ERROR, MISSING_ARG_ERROR, COMMAND_EXECUTION_ERROR, FATAL_ERROR)
     * @returns {Error} The error to be thrown
     */
    setType(type) {
        this.type = type;
        return this;
    }

    /**
     * Set the error message
     * @param {string} message - The error message
     * @returns {Error} The error to be thrown
     */
    setMessage(message) {
        this.message = message;
        return this;
    }

    /**
     * Set the error name
     * @param {string} name - The error name
     * @returns {Error} The error to be thrown
     */
    setName(name) {
        this.name = name;
        return this;
    }

    /**
     * Log the error in the console
     * @returns {Error} The error to be thrown
     */
    logError(){
        console.log(`[${moment().format('DD/MM/YYYY')} - ${moment().format('HH:mm:ss:SSS')}][Error][${this.type}]${this.stack}`.red);
        return this;
    }
}