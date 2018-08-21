import { Mirror, AbstractDecorator, MirrorType } from "@zuu/mirror";
;
;
export class ComponentDecorator extends AbstractDecorator {
    constructor() {
        super(MirrorType.CLASS, "hyena.decorators.component");
    }
    annotate(instance, target) {
        let keys = Reflect.getMetadata("hyena:properties", target) || [];
        target = Object.assign(target, { observedAttributes: keys.map(x => x.name) });
        customElements.define(instance.tag, target);
        return target;
    }
}
;
export const Component = Mirror.decorator(new ComponentDecorator);
//# sourceMappingURL=component.js.map