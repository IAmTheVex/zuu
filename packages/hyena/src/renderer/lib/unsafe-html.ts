import { _isPrimitiveValue, directive, DirectiveFn, NodePart } from "../core";

export const unsafeHTML = (value: any): DirectiveFn<NodePart> =>
  directive(
    (part: NodePart): void => {
      if (part._previousValue === value && _isPrimitiveValue(value)) {
        return;
      }
      const tmp = document.createElement("template");
      tmp.innerHTML = value;
      part.setValue(document.importNode(tmp.content, true));
      part._previousValue = value;
    }
  );
