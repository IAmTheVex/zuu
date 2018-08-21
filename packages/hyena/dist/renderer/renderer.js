import { AttributePart, defaultPartCallback, getValue, noChange, SVGTemplateResult, TemplateResult } from "./core";
export { render } from "./core";
export const html = (strings, ...values) => new TemplateResult(strings, values, "html", partCallback);
export const svg = (strings, ...values) => new SVGTemplateResult(strings, values, "svg", partCallback);
export const partCallback = (instance, templatePart, node) => {
    if (templatePart.type === "attribute") {
        const name = templatePart.name;
        const prefix = name[0];
        if (prefix === ".") {
            return new PropertyPart(instance, node, name.slice(1), templatePart.strings);
        }
        if (prefix === "@") {
            return new EventPart(instance, node, name.slice(1));
        }
        if (prefix === "?") {
            return new BooleanAttributePart(instance, node, name.slice(1), templatePart.strings);
        }
    }
    return defaultPartCallback(instance, templatePart, node);
};
export class BooleanAttributePart extends AttributePart {
    setValue(values, startIndex) {
        const s = this.strings;
        if (s.length === 2 && s[0] === "" && s[1] === "") {
            const value = getValue(this, values[startIndex]);
            if (value === noChange) {
                return;
            }
            if (value) {
                this.element.setAttribute(this.name, "");
            }
            else {
                this.element.removeAttribute(this.name);
            }
        }
        else {
            throw new Error("boolean attributes can only contain a single expression");
        }
    }
}
export class PropertyPart extends AttributePart {
    setValue(values, startIndex) {
        const s = this.strings;
        let value;
        if (this._equalToPreviousValues(values, startIndex)) {
            return;
        }
        if (s.length === 2 && s[0] === "" && s[1] === "") {
            value = getValue(this, values[startIndex]);
        }
        else {
            // Interpolation, so interpolate
            value = this._interpolate(values, startIndex);
        }
        if (value !== noChange) {
            this.element[this.name] = value;
        }
        this._previousValues = values;
    }
}
export class EventPart {
    constructor(instance, element, eventName) {
        this.instance = instance;
        this.element = element;
        this.eventName = eventName;
    }
    setValue(value) {
        const listener = getValue(this, value);
        if (listener === this._listener) {
            return;
        }
        if (listener == null) {
            this.element.removeEventListener(this.eventName, this);
        }
        else if (this._listener == null) {
            this.element.addEventListener(this.eventName, this);
        }
        this._listener = listener;
    }
    handleEvent(event) {
        if (typeof this._listener === "function") {
            this._listener.call(this.element, event);
        }
        else if (typeof this._listener.handleEvent === "function") {
            this._listener.handleEvent(event);
        }
    }
}
//# sourceMappingURL=renderer.js.map