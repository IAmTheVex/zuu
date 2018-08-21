import { directive, DirectiveFn, NodePart } from "../core";

export const asyncAppend = <T>(
  value: AsyncIterable<T>,
  mapper?: (v: T, index?: number) => any
): DirectiveFn<NodePart> =>
  directive(async (part: NodePart) => {
    if (value === part._previousValue) {
      return;
    }
    part._previousValue = value;

    let itemPart;
    let i = 0;

    for await (let v of value) {
      if (i === 0) {
        part.clear();
      }

      if (part._previousValue !== value) {
        break;
      }

      if (mapper !== undefined) {
        v = mapper(v, i);
      }

      let itemStartNode = part.startNode;

      if (itemPart !== undefined) {
        itemStartNode = document.createTextNode("");
        itemPart.endNode = itemStartNode;
        part.endNode.parentNode!.insertBefore(itemStartNode, part.endNode);
      }
      itemPart = new NodePart(part.instance, itemStartNode, part.endNode);
      itemPart.setValue(v);
      i++;
    }
  });
