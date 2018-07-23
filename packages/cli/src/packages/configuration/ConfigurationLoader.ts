import * as path from "path";
import * as fs from "fs";
import { Config } from './Config';

export class ConfigurationLoader {
    private static config: Config;

    public static export(): Config {
        if(!this.config) {
            this.reload();
        }
        
        return this.config;
    };

    public static reload() {
        try {
            let contents: string = fs.readFileSync(path.join(process.cwd(), "zuu.config.json")).toString();
            this.config = JSON.parse(contents);
        } catch(ex) { }

        if(!this.config) this.config = { paths: { app: "app" } };
        if(!this.config.paths) this.config.paths = { app: "app" };
        if(!this.config.paths.app) this.config.paths.app = "app"; 
    };
};