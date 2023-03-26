/////////////////////////////////
//error event handler
/////////////////////////////////

//Importing classes
import { DiscordError } from '../classes/Errors';
import FileLogger from '../classes/FileLogger';
import TobyBot from '../classes/TobyBot';

//Creating objects
const MainLog = new FileLogger();

export default {
    name: 'error',
    once: false,
    async exec(TobyBot: TobyBot, Error: Error) {
        throw new DiscordError("An error occured with discord.", {cause: Error}).logError();
    }
}