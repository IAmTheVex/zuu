import { IDecoration, AbstractDecorator, MirrorType, Mirror } from "@zuu/mirror";
import { ConfigManager } from "./ConfigManager";

export interface ConfigDecoration extends IDecoration {
    name: string;
    reload?: boolean;
 }

export class ConfigDecorator extends AbstractDecorator<ConfigDecoration> {
    public constructor(){
        super(MirrorType.PROPERTY, "zuu.common.config");
    }
    
    public annotate(instance: ConfigDecoration, target: any, key?: string | symbol, index?: number) {
        let { name, reload } = instance;
        target[key] = ConfigManager.obtain(name, reload);
    }
}

export const Configuration = (name: string, reload: boolean = false) => Mirror.decorator<ConfigDecoration, PropertyDecorator>(new ConfigDecorator)({ name, reload });