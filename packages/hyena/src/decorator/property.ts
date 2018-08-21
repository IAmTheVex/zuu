import { IDecoration, AbstractDecorator, MirrorType, Mirror, ReflectedProperty } from '@zuu/mirror';
import { camelToDashes } from './util';

export interface PropertyParameters extends IDecoration {
    type?: String,
    watch?: boolean
};

export class PropertyBindDecorator extends AbstractDecorator<PropertyParameters> {
    constructor() {
        super(MirrorType.PROPERTY, "hyena.decorators.property");
    }

    public annotate(instance: PropertyParameters, target: any, key?: string) {
        let reflection: ReflectedProperty = Mirror.reflect(target.constructor, key);
        let cast: (s: string) => any = (s: string) => s;
        let type = null;

        if(instance.type) type = instance.type;
        else if(reflection.type && reflection.type.name) type = reflection.type.name;
        
        if(!!type) {
            if(type == "Number" || type == "Int") cast = (s: string) => parseInt(s);
            else if(type == "Float") cast = (s: string) => parseFloat(s);
            else if(type == "JSON") cast = (s: string) => JSON.parse(s);
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

        if(instance.watch){
            let keys = Reflect.getMetadata("hyena:properties", target.constructor) || [];
            keys.push({ name, key });
            Reflect.defineMetadata("hyena:properties", keys, target.constructor);    
        }
        
        return Object.getOwnPropertyDescriptor(target.constructor, key);
    }
}

export const Property = (watch: boolean = true, type?: "String" | "Int" | "Float" | "JSON") => {
    if(!type) type = undefined;
    let options = { type, watch };
    return Mirror.decorator<PropertyParameters, PropertyDecorator>(new PropertyBindDecorator)(options);
};