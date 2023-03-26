import moment from 'moment';
import Command from './Command';

export type AnyError = DefaultError | UnknownError | MissingArgumentError | CommandExecutionError |FatalError | SQLError | FileError | TypeError | DiscordError | EventHandlingError | CommandHandlingError | WaitingForMessageError;

export class DefaultError implements Error {
    name: string;
    message: string;
    handled?: boolean;
    cause?: Error;
    stack?: string;
    constructor(message: string, options?: {cause?: Error}) {
        this.name = "DefaultError";
        this.message = message;
        this.handled = false;
        this.cause = options.cause;
    }

    setMessage(message: string): AnyError {
        this.message = message;
        return this;
    }

    setName(name: string): AnyError {
        this.name = name;
        return this;
    }

    setHandled(handled: boolean = true): AnyError {
        this.handled= handled;
        return this;
    }

    logError(): AnyError {
        console.log(`[${moment().format('DD/MM/YYYY')} - ${moment().format('HH:mm:ss:SSS')}][${this.name}]${this.stack}`.red);
        return this;
    }
}

export class UnknownError extends DefaultError {
    argument: [string] | string;
    constructor(message: string, options?: {cause?: Error, argument?: [string] | string}){
        super(message, options);

        this.name = "UnknownError";
        this.argument = options.argument;
    }
}

export class MissingArgumentError extends DefaultError {
    argument: [string] | string;
    constructor(message: string, options?: {cause?: Error, argument?: [string] | string}){
        super(message, options);

        this.name = "MissingArgumentError";
        this.argument = options.argument;
    }
}

export class CommandExecutionError extends DefaultError {
    command: Command;
    constructor(message: string, options?: {cause?: Error, command?: Command}){
        super(message, options);

        this.name = "CommandExecutionError";
        this.command = options.command;
    }
}

export class FatalError extends DefaultError {
    constructor(message: string, options?: {cause?: Error}){
        super(message, options);

        this.name = "FatalError";
    }
}

export class SQLError extends DefaultError {
    constructor(message: string, options?: {cause?: Error}){
        super(message, options);

        this.name = "SQLError";
    }
}

export class FileError extends DefaultError {
    constructor(message: string, options?: {cause?: Error}){
        super(message, options);

        this.name = "FileError";
    }
}

export class TypeError extends DefaultError {
    constructor(message: string, options?: {cause?: Error}){
        super(message, options);

        this.name = "TypeError";
    }
}

export class DiscordError extends DefaultError {
    constructor(message: string, options?: {cause?: Error}){
        super(message, options);

        this.name = "DiscordError";
    }
}

export class EventHandlingError extends DefaultError {
    event: string;
    constructor(message: string, options?: {cause?: Error, event?: string}){
        super(message, options);

        this.name = "EventHandlingError";
        this.event = options.event;
    }
}
export class CommandHandlingError extends DefaultError {
    constructor(message: string, options?: {cause?: Error, command?: Command}){
        super(message, options);

        this.name = "CommandHandlingError";
    }
}
export class WaitingForMessageError extends DefaultError {
    constructor(message: string, options?: {cause?: Error}){
        super(message, options);

        this.name = "WaitingForMessageError";
    }
}