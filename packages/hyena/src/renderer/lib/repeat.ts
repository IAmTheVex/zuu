import {
  directive,
  DirectiveFn,
  NodePart,
  removeNodes,
  reparentNodes
} from "../core";

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

const keyMapCache = new WeakMap<NodePart, Map<any, NodePart>>();

function cleanMap(part: NodePart, key: any, map: Map<any, NodePart>) {
  if (!part.startNode.parentNode) {
    map.delete(key);
  }
}

export function repeat<T>(
  items: T[],
  keyFn: KeyFn<T>,
  template: ItemTemplate<T>
): DirectiveFn<NodePart>;
export function repeat<T>(
  items: T[],
  template: ItemTemplate<T>
): DirectiveFn<NodePart>;
export function repeat<T>(
  items: Iterable<T>,
  keyFnOrTemplate: KeyFn<T> | ItemTemplate<T>,
  template?: ItemTemplate<T>
): DirectiveFn<NodePart> {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return directive(
    (part: NodePart): void => {
      let keyMap = keyMapCache.get(part);
      if (keyMap === undefined) {
        keyMap = new Map();
        keyMapCache.set(part, keyMap);
      }
      const container = part.startNode.parentNode as
        | HTMLElement
        | ShadowRoot
        | DocumentFragment;
      let index = -1;
      let currentMarker = part.startNode.nextSibling!;

      for (const item of items) {
        let result;
        let key;
        try {
          ++index;
          result = template!(item, index);
          key = keyFn ? keyFn(item) : index;
        } catch (e) {
          console.error(e);
          continue;
        }

        let itemPart = keyMap.get(key);
        if (itemPart === undefined) {
          const marker = document.createTextNode("");
          const endNode = document.createTextNode("");
          container.insertBefore(marker, currentMarker);
          container.insertBefore(endNode, currentMarker);
          itemPart = new NodePart(part.instance, marker, endNode);
          if (key !== undefined) {
            keyMap.set(key, itemPart);
          }
        } else if (currentMarker !== itemPart.startNode) {
          const end = itemPart.endNode.nextSibling!;
          if (currentMarker !== end) {
            reparentNodes(container, itemPart.startNode, end, currentMarker);
          }
        } else {
          currentMarker = itemPart.endNode.nextSibling!;
        }

        itemPart.setValue(result);
      }

      if (currentMarker !== part.endNode) {
        removeNodes(container, currentMarker, part.endNode);
        keyMap.forEach(cleanMap);
      }
    }
  );
}
