import { directive, DirectiveFn, NodePart } from "../core";

export const asyncReplace = <T>(
  value: AsyncIterable<T>,
  mapper?: (v: T, index?: number) => any
): DirectiveFn<NodePart> =>
  directive(async (part: NodePart) => {
    if (value === part._previousValue) {
      return;
    }

    const itemPart = new NodePart(part.instance, part.startNode, part.endNode);

    part._previousValue = itemPart;

    let i = 0;

    for await (let v of value) {
      if (i === 0) {
        part.clear();
      }

      if (part._previousValue !== itemPart) {
        break;
      }

      if (mapper !== undefined) {
        v = mapper(v, i);
      }

      itemPart.setValue(v);
      i++;
    }
  });
