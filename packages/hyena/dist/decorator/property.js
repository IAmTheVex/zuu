import { AbstractDecorator, MirrorType, Mirror } from '@zuu/mirror';
import { camelToDashes } from './util';
;
export class PropertyBindDecorator extends AbstractDecorator {
    constructor() {
        super(MirrorType.PROPERTY, "hyena.decorators.property");
    }
    annotate(instance, target, key) {
        let reflection = Mirror.reflect(target.constructor, key);
        let cast = (s) => s;
        let type = null;
        if (instance.type)
            type = instance.type;
        else if (reflection.type && reflection.type.name)
            type = reflection.type.name;
        if (!!type) {
            if (type == "Number" || type == "Int")
                cast = (s) => parseInt(s);
            else if (type == "Float")
                cast = (s) => parseFloat(s);
            else if (type == "JSON")
                cast = (s) => JSON.parse(s);
        }
        let name = camelToDashes(key);
        Object.defineProperty(target.constructor, key, {
            get() {
                return cast(this.getAttribute(name));
            },
            set(value) {
                console.log("hello!");
                this.setAttribute(name, value);
            }
        });
        if (instance.watch) {
            let keys = Reflect.getMetadata("hyena:properties", target.constructor) || [];
            keys.push({ name, key });
            Reflect.defineMetadata("hyena:properties", keys, target.constructor);
        }
        return Object.getOwnPropertyDescriptor(target.constructor, key);
    }
}
export const Property = (watch = true, type) => {
    if (!type)
        type = undefined;
    let options = { type, watch };
    return Mirror.decorator(new PropertyBindDecorator)(options);
};
//# sourceMappingURL=property.js.map