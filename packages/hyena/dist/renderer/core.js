export const templateCaches = new Map();
export const html = (strings, ...values) => new TemplateResult(strings, values, "html");
export const svg = (strings, ...values) => new SVGTemplateResult(strings, values, "svg");
export class TemplateResult {
    constructor(strings, values, type, partCallback = defaultPartCallback) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.partCallback = partCallback;
    }
    getHTML() {
        const l = this.strings.length - 1;
        let html = "";
        let isTextBinding = true;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            html += s;
            const close = s.lastIndexOf(">");
            isTextBinding =
                (close > -1 || isTextBinding) && s.indexOf("<", close + 1) === -1;
            html += isTextBinding ? nodeMarker : marker;
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement("template");
        template.innerHTML = this.getHTML();
        return template;
    }
}
export class SVGTemplateResult extends TemplateResult {
    getHTML() {
        return `<svg>${super.getHTML()}</svg>`;
    }
    getTemplateElement() {
        const template = super.getTemplateElement();
        const content = template.content;
        const svgElement = content.firstChild;
        content.removeChild(svgElement);
        reparentNodes(content, svgElement.firstChild);
        return template;
    }
}
export function defaultTemplateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = new Map();
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.get(result.strings);
    if (template === undefined) {
        template = new Template(result, result.getTemplateElement());
        templateCache.set(result.strings, template);
    }
    return template;
}
export function render(result, container, templateFactory = defaultTemplateFactory) {
    const template = templateFactory(result);
    let instance = container.__templateInstance;
    if (instance !== undefined &&
        instance.template === template &&
        instance._partCallback === result.partCallback) {
        instance.update(result.values);
        return;
    }
    instance = new TemplateInstance(template, result.partCallback, templateFactory);
    container.__templateInstance = instance;
    const fragment = instance._clone();
    removeNodes(container, container.firstChild);
    container.appendChild(fragment);
    instance.update(result.values);
}
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;
export class TemplatePart {
    constructor(type, index, name, strings) {
        this.type = type;
        this.index = index;
        this.name = name;
        this.strings = strings;
    }
    get rawName() {
        return this.name;
    }
}
export const isTemplatePartActive = (part) => part.index !== -1;
export class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        let index = -1;
        let partIndex = 0;
        const nodesToRemove = [];
        const _prepareTemplate = (template) => {
            const content = template.content;
            const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                      NodeFilter.SHOW_TEXT */, null, false);
            let previousNode;
            let currentNode;
            while (walker.nextNode()) {
                index++;
                previousNode = currentNode;
                const node = (currentNode = walker.currentNode);
                if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                    if (node.hasAttributes()) {
                        const attributes = node.attributes;
                        let count = 0;
                        for (let i = 0; i < attributes.length; i++) {
                            if (attributes[i].value.indexOf(marker) >= 0) {
                                count++;
                            }
                        }
                        while (count-- > 0) {
                            const stringForPart = result.strings[partIndex];
                            const attributeNameInPart = lastAttributeNameRegex.exec(stringForPart)[1];
                            const attributeLookupName = /^[a-zA-Z-]*$/.test(attributeNameInPart)
                                ? attributeNameInPart
                                : attributeNameInPart.toLowerCase();
                            const attributeValue = node.getAttribute(attributeLookupName);
                            const stringsForAttributeValue = attributeValue.split(markerRegex);
                            this.parts.push(new TemplatePart("attribute", index, attributeNameInPart, stringsForAttributeValue));
                            node.removeAttribute(attributeLookupName);
                            partIndex += stringsForAttributeValue.length - 1;
                        }
                    }
                    if (node.tagName === "TEMPLATE") {
                        _prepareTemplate(node);
                    }
                }
                else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                    const nodeValue = node.nodeValue;
                    if (nodeValue.indexOf(marker) < 0) {
                        continue;
                    }
                    const parent = node.parentNode;
                    const strings = nodeValue.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    partIndex += lastIndex;
                    for (let i = 0; i < lastIndex; i++) {
                        parent.insertBefore(strings[i] === ""
                            ? document.createComment("")
                            : document.createTextNode(strings[i]), node);
                        this.parts.push(new TemplatePart("node", index++));
                    }
                    parent.insertBefore(strings[lastIndex] === ""
                        ? document.createComment("")
                        : document.createTextNode(strings[lastIndex]), node);
                    nodesToRemove.push(node);
                }
                else if (node.nodeType === 8 /* Node.COMMENT_NODE */ &&
                    node.nodeValue === marker) {
                    const parent = node.parentNode;
                    const previousSibling = node.previousSibling;
                    if (previousSibling === null ||
                        previousSibling !== previousNode ||
                        previousSibling.nodeType !== Node.TEXT_NODE) {
                        parent.insertBefore(document.createComment(""), node);
                    }
                    else {
                        index--;
                    }
                    this.parts.push(new TemplatePart("node", index++));
                    nodesToRemove.push(node);
                    if (node.nextSibling === null) {
                        parent.insertBefore(document.createComment(""), node);
                    }
                    else {
                        index--;
                    }
                    currentNode = previousNode;
                    partIndex++;
                }
            }
        };
        _prepareTemplate(element);
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
export const getValue = (part, value) => {
    if (isDirective(value)) {
        value = value(part);
        return noChange;
    }
    return value === null ? undefined : value;
};
export const directive = (f) => {
    f.__litDirective = true;
    return f;
};
const isDirective = (o) => typeof o === "function" && o.__litDirective === true;
export const noChange = {};
export { noChange as directiveValue };
export const _isPrimitiveValue = (value) => value === null || !(typeof value === "object" || typeof value === "function");
export class AttributePart {
    constructor(instance, element, name, strings) {
        this.instance = instance;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.size = strings.length - 1;
        this._previousValues = [];
    }
    _interpolate(values, startIndex) {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = "";
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const v = getValue(this, values[startIndex + i]);
            if (v &&
                v !== noChange &&
                (Array.isArray(v) || (typeof v !== "string" && v[Symbol.iterator]))) {
                for (const t of v) {
                    text += t;
                }
            }
            else {
                text += v;
            }
        }
        return text + strings[l];
    }
    _equalToPreviousValues(values, startIndex) {
        if (this._previousValues.length === 0) {
            return false;
        }
        for (let i = startIndex; i < startIndex + this.size; i++) {
            if (this._previousValues[i] !== values[i] ||
                !_isPrimitiveValue(values[i])) {
                return false;
            }
        }
        return true;
    }
    setValue(values, startIndex) {
        if (this._equalToPreviousValues(values, startIndex)) {
            return;
        }
        const s = this.strings;
        let value;
        if (s.length === 2 && s[0] === "" && s[1] === "") {
            value = getValue(this, values[startIndex]);
            if (Array.isArray(value)) {
                value = value.join("");
            }
        }
        else {
            value = this._interpolate(values, startIndex);
        }
        if (value !== noChange) {
            this.element.setAttribute(this.name, value);
        }
        this._previousValues = values;
    }
}
export class NodePart {
    constructor(instance, startNode, endNode) {
        this.instance = instance;
        this.startNode = startNode;
        this.endNode = endNode;
        this._previousValue = undefined;
    }
    setValue(value) {
        value = getValue(this, value);
        if (value === noChange) {
            return;
        }
        if (_isPrimitiveValue(value)) {
            if (value === this._previousValue) {
                return;
            }
            this._setText(value);
        }
        else if (value instanceof TemplateResult) {
            this._setTemplateResult(value);
        }
        else if (value instanceof Node) {
            this._setNode(value);
        }
        else if (Array.isArray(value) || value[Symbol.iterator]) {
            this._setIterable(value);
        }
        else if (value.then !== undefined) {
            this._setPromise(value);
        }
        else {
            this._setText(value);
        }
    }
    _insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    _setNode(value) {
        if (this._previousValue === value) {
            return;
        }
        this.clear();
        this._insert(value);
        this._previousValue = value;
    }
    _setText(value) {
        const node = this.startNode.nextSibling;
        value = value === undefined ? "" : value;
        if (node === this.endNode.previousSibling &&
            node.nodeType === Node.TEXT_NODE) {
            node.textContent = value;
        }
        else {
            this._setNode(document.createTextNode(value));
        }
        this._previousValue = value;
    }
    _setTemplateResult(value) {
        const template = this.instance._getTemplate(value);
        let instance;
        if (this._previousValue && this._previousValue.template === template) {
            instance = this._previousValue;
        }
        else {
            instance = new TemplateInstance(template, this.instance._partCallback, this.instance._getTemplate);
            this._setNode(instance._clone());
            this._previousValue = instance;
        }
        instance.update(value.values);
    }
    _setIterable(value) {
        if (!Array.isArray(this._previousValue)) {
            this.clear();
            this._previousValue = [];
        }
        const itemParts = this._previousValue;
        let partIndex = 0;
        for (const item of value) {
            let itemPart = itemParts[partIndex];
            if (itemPart === undefined) {
                let itemStart = this.startNode;
                if (partIndex > 0) {
                    const previousPart = itemParts[partIndex - 1];
                    itemStart = previousPart.endNode = document.createTextNode("");
                    this._insert(itemStart);
                }
                itemPart = new NodePart(this.instance, itemStart, this.endNode);
                itemParts.push(itemPart);
            }
            itemPart.setValue(item);
            partIndex++;
        }
        if (partIndex === 0) {
            this.clear();
            this._previousValue = undefined;
        }
        else if (partIndex < itemParts.length) {
            const lastPart = itemParts[partIndex - 1];
            itemParts.length = partIndex;
            this.clear(lastPart.endNode.previousSibling);
            lastPart.endNode = this.endNode;
        }
    }
    _setPromise(value) {
        this._previousValue = value;
        value.then((v) => {
            if (this._previousValue === value) {
                this.setValue(v);
            }
        });
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
export const defaultPartCallback = (instance, templatePart, node) => {
    if (templatePart.type === "attribute") {
        return new AttributePart(instance, node, templatePart.name, templatePart.strings);
    }
    else if (templatePart.type === "node") {
        return new NodePart(instance, node, node.nextSibling);
    }
    throw new Error(`Unknown part type ${templatePart.type}`);
};
export class TemplateInstance {
    constructor(template, partCallback, getTemplate) {
        this._parts = [];
        this.template = template;
        this._partCallback = partCallback;
        this._getTemplate = getTemplate;
    }
    update(values) {
        let valueIndex = 0;
        for (const part of this._parts) {
            if (!part) {
                valueIndex++;
            }
            else if (part.size === undefined) {
                part.setValue(values[valueIndex]);
                valueIndex++;
            }
            else {
                part.setValue(values, valueIndex);
                valueIndex += part.size;
            }
        }
    }
    _clone() {
        const fragment = this.template.element.content.cloneNode(true);
        const parts = this.template.parts;
        let partIndex = 0;
        let nodeIndex = 0;
        const _prepareInstance = (fragment) => {
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                    NodeFilter.SHOW_TEXT */, null, false);
            let node = walker.nextNode();
            while (partIndex < parts.length && node !== null) {
                const part = parts[partIndex];
                if (!isTemplatePartActive(part)) {
                    this._parts.push(undefined);
                    partIndex++;
                }
                else if (nodeIndex === part.index) {
                    this._parts.push(this._partCallback(this, part, node));
                    partIndex++;
                }
                else {
                    nodeIndex++;
                    if (node.nodeName === "TEMPLATE") {
                        _prepareInstance(node.content);
                    }
                    node = walker.nextNode();
                }
            }
        };
        _prepareInstance(fragment);
        return fragment;
    }
}
export const reparentNodes = (container, start, end = null, before = null) => {
    let node = start;
    while (node !== end) {
        const n = node.nextSibling;
        container.insertBefore(node, before);
        node = n;
    }
};
export const removeNodes = (container, startNode, endNode = null) => {
    let node = startNode;
    while (node !== endNode) {
        const n = node.nextSibling;
        container.removeChild(node);
        node = n;
    }
};
//# sourceMappingURL=core.js.map