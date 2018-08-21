import {
  AttributePart,
  defaultPartCallback,
  Part,
  SVGTemplateResult,
  TemplateInstance,
  TemplatePart,
  TemplateResult
} from "../core";
import { BooleanAttributePart, EventPart, PropertyPart } from "../renderer";

export { render } from "../core";
export { BooleanAttributePart, EventPart, PropertyPart } from "../renderer";

export const html = (strings: TemplateStringsArray, ...values: any[]) =>
  new TemplateResult(strings, values, "html", extendedPartCallback);

export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
  new SVGTemplateResult(strings, values, "svg", extendedPartCallback);

export const extendedPartCallback = (
  instance: TemplateInstance,
  templatePart: TemplatePart,
  node: Node
): Part => {
  if (templatePart.type === "attribute") {
    if (templatePart.rawName!.substr(0, 3) === "on-") {
      const eventName = templatePart.rawName!.slice(3);
      return new EventPart(instance, node as Element, eventName);
    }
    const lastChar = templatePart.name!.substr(templatePart.name!.length - 1);
    if (lastChar === "$") {
      const name = templatePart.name!.slice(0, -1);
      return new AttributePart(
        instance,
        node as Element,
        name,
        templatePart.strings!
      );
    }
    if (lastChar === "?") {
      const name = templatePart.name!.slice(0, -1);
      return new BooleanAttributePart(
        instance,
        node as Element,
        name,
        templatePart.strings!
      );
    }
    return new PropertyPart(
      instance,
      node as Element,
      templatePart.rawName!,
      templatePart.strings!
    );
  }
  return defaultPartCallback(instance, templatePart, node);
};
