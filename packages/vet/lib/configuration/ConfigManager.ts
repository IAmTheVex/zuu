import * as fs from "fs";
import * as path from "path";

import { IConfig } from "./IConfig";

const searchConfigFile = function (name: string): string {
    let configFile = path.join(__dirname, '.config', name + '.config.json');
    while (!fs.existsSync(configFile)) {
        const fileOnParent = path.normalize(path.join(path.dirname(configFile), '..', '..', '.config', name + '.config.json'));
        if (configFile === fileOnParent) {
            return null;
        }
        configFile = fileOnParent;
    }
    return configFile;
};

const readConfigFile = function (configFile: string): Object {
    if (configFile && fs.existsSync(configFile)) {
        try {
            return JSON.parse(fs.readFileSync(configFile).toString());
        } catch(e) {
            return {};
        }
    }

    return {};
}

export class ConfigManager {
    private static _paths: Map<string, string> = new Map<string, string>();
    private static _obbjects: Map<string, IConfig> = new Map<string, IConfig>();

    public static obtain(name: string, reload: boolean = false): IConfig {
        let object = this._obbjects.get(name);
        if(!object || reload) 
            return this.reload(name);
        return object;
    }

    public static seek(name: string) {
        this._paths[name] = searchConfigFile(name);
        return this._paths[name];
    }

    public static reload(name: string): IConfig {
        let pt = this._paths.get(name);
        if(!pt) pt = this.seek(name);
        this._obbjects.set(pt, readConfigFile(pt));
        return this._obbjects.get(pt);
    }
}
