import { _isPrimitiveValue, directive } from "../core";
export const unsafeHTML = (value) => directive((part) => {
    if (part._previousValue === value && _isPrimitiveValue(value)) {
        return;
    }
    const tmp = document.createElement("template");
    tmp.innerHTML = value;
    part.setValue(document.importNode(tmp.content, true));
    part._previousValue = value;
});
//# sourceMappingURL=unsafe-html.js.map