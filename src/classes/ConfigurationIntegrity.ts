//Importing NodeJS Modules

//Importing classes
import FileLogger from './FileLogger';
import TobyBot from './TobyBot';

//Creating objects
const MainLog = new FileLogger();
const ErrorLog = new FileLogger('error.log');

export default class ConfigurationIntegrity {
    TobyBot: TobyBot;
    constructor(TobyBot: TobyBot) {
        this.TobyBot = TobyBot;
    }

    integrityCheck(defaultConfiguration, oldConfiguration){
        let updated = false;
        let recursiveMerge = this.mergeRecursive(defaultConfiguration, oldConfiguration);
        if (recursiveMerge.updated){
            updated = true;
            oldConfiguration = recursiveMerge.result;
        }
        let convertVersion = this.convertVersion(defaultConfiguration, oldConfiguration);
        if (convertVersion.updated){
            updated = true;
            oldConfiguration = convertVersion.result;
        }
        return { result: oldConfiguration, updated: updated };
    }

    convertVersion(defaultConfiguration, oldConfiguration) {
        if (defaultConfiguration.system["config-version"] == oldConfiguration.system["config-version"])return { result: oldConfiguration, updated: false };
        let updated = false;
        return { result: oldConfiguration, updated: updated };
    }

    mergeRecursive(oldConfiguration, defaultConfiguration) {
        var updated = false;
        for (var p in defaultConfiguration) {
            try {
                if (defaultConfiguration[p].constructor == Object){
                    let mergeRecursiveEmbeded = this.mergeRecursive(oldConfiguration[p], defaultConfiguration[p]);
                    if (mergeRecursiveEmbeded.updated){
                        updated = true;
                        oldConfiguration[p] = mergeRecursiveEmbeded.result;
                    }
                }else {
                    if (typeof defaultConfiguration[p] != typeof oldConfiguration[p]){
                        oldConfiguration[p] = defaultConfiguration[p];
                        updated = true;
                    }
                }
            } catch (e) {
                oldConfiguration[p] = defaultConfiguration[p];
                updated = true;
            }
        }
        return { result: oldConfiguration, updated: updated };
    }
}