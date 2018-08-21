import { AttributePart, defaultPartCallback, SVGTemplateResult, TemplateResult } from "../core";
import { BooleanAttributePart, EventPart, PropertyPart } from "../renderer";
export { render } from "../core";
export { BooleanAttributePart, EventPart, PropertyPart } from "../renderer";
export const html = (strings, ...values) => new TemplateResult(strings, values, "html", extendedPartCallback);
export const svg = (strings, ...values) => new SVGTemplateResult(strings, values, "svg", extendedPartCallback);
export const extendedPartCallback = (instance, templatePart, node) => {
    if (templatePart.type === "attribute") {
        if (templatePart.rawName.substr(0, 3) === "on-") {
            const eventName = templatePart.rawName.slice(3);
            return new EventPart(instance, node, eventName);
        }
        const lastChar = templatePart.name.substr(templatePart.name.length - 1);
        if (lastChar === "$") {
            const name = templatePart.name.slice(0, -1);
            return new AttributePart(instance, node, name, templatePart.strings);
        }
        if (lastChar === "?") {
            const name = templatePart.name.slice(0, -1);
            return new BooleanAttributePart(instance, node, name, templatePart.strings);
        }
        return new PropertyPart(instance, node, templatePart.rawName, templatePart.strings);
    }
    return defaultPartCallback(instance, templatePart, node);
};
//# sourceMappingURL=renderer-extended.js.map