import { directive, DirectiveFn, NodePart } from "../core";

export const until = (
  promise: Promise<any>,
  defaultContent: any
): DirectiveFn<NodePart> =>
  directive(
    (part: NodePart): void => {
      part.setValue(defaultContent);
      part.setValue(promise);
    }
  );
