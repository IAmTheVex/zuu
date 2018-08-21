import { AbstractDecorator, IDecoration, MirrorType, Mirror } from '@zuu/mirror';
import { camelToDashes } from './util';

export interface WatchParameters extends IDecoration { };

export class WatchDecorator extends AbstractDecorator<WatchParameters> {
    constructor() {
        super(MirrorType.METHOD, "hyena.decorators.watch");
    }

    public annotate(instance: WatchParameters, target: any, key?: string) {
        let keys = Reflect.getMetadata("hyena:properties", target.constructor) || [];
        let nameComponents = camelToDashes(key).split("-");
        nameComponents.pop();
        let name = nameComponents.join("-");
        
        keys.push({ name, key });
        Reflect.defineMetadata("hyena:properties", keys, target.constructor);
    }
}

export const Watch = Mirror.decorator<WatchParameters, MethodDecorator>(new WatchDecorator)({});