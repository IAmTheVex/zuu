import { AbstractDecorator, MirrorType, Mirror } from '@zuu/mirror';
import { camelToDashes } from './util';
;
export class WatchDecorator extends AbstractDecorator {
    constructor() {
        super(MirrorType.METHOD, "hyena.decorators.watch");
    }
    annotate(instance, target, key) {
        let keys = Reflect.getMetadata("hyena:properties", target.constructor) || [];
        let nameComponents = camelToDashes(key).split("-");
        nameComponents.pop();
        let name = nameComponents.join("-");
        keys.push({ name, key });
        Reflect.defineMetadata("hyena:properties", keys, target.constructor);
    }
}
export const Watch = Mirror.decorator(new WatchDecorator)({});
//# sourceMappingURL=watch.js.map