import { Mirror, AbstractDecorator, IDecoration, MirrorType } from "@zuu/mirror";
import { Class } from './util';;

export interface ComponentParameters extends IDecoration {
    tag: string
};

export class ComponentDecorator extends AbstractDecorator<ComponentParameters> {
    constructor() {
        super(MirrorType.CLASS, "hyena.decorators.component");
    }

    public annotate(instance: ComponentParameters, target: Class<any>) {
        let keys = Reflect.getMetadata("hyena:properties", target) || [];
        target = Object.assign(target, { observedAttributes: keys.map(x => x.name) });
        customElements.define(instance.tag, target);
        return target;
    }
};

export const Component = Mirror.decorator<ComponentParameters, ClassDecorator>(new ComponentDecorator);