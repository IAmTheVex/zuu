import {PlatformTools} from "../../platform/PlatformTools";
import {ConnectionOptions} from "../ConnectionOptions";

export class ConnectionOptionsYmlReader {

    read(path: string): ConnectionOptions[] {
        const ymlParser = PlatformTools.load("js-yaml");
        const config = ymlParser.safeLoad(PlatformTools.readFileSync(path));
        return Object.keys(config).map(connectionName => {
            return Object.assign({ name: connectionName }, config[connectionName]);
        });
    }

}