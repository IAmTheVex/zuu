import { removeNodes, Template, templateCaches, TemplateInstance } from "../core";
import { insertNodeIntoTemplate, removeNodesFromTemplate } from "./modify-template";
export { html, svg, TemplateResult } from "../core";
const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
const verifyShadyCSSVersion = () => {
    if (typeof window.ShadyCSS === "undefined") {
        return false;
    }
    if (typeof window.ShadyCSS.prepareTemplateDom === "undefined") {
        console.warn(`Incompatible ShadyCSS version detected.` +
            `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and` +
            `@webcomponents/shadycss@1.3.1.`);
        return false;
    }
    return true;
};
const shadyTemplateFactory = (scopeName) => (result) => {
    const cacheKey = getTemplateCacheKey(result.type, scopeName);
    let templateCache = templateCaches.get(cacheKey);
    if (templateCache === undefined) {
        templateCache = new Map();
        templateCaches.set(cacheKey, templateCache);
    }
    let template = templateCache.get(result.strings);
    if (template === undefined) {
        const element = result.getTemplateElement();
        if (verifyShadyCSSVersion()) {
            window.ShadyCSS.prepareTemplateDom(element, scopeName);
        }
        template = new Template(result, element);
        templateCache.set(result.strings, template);
    }
    return template;
};
const TEMPLATE_TYPES = ["html", "svg"];
function removeStylesFromLitTemplates(scopeName) {
    TEMPLATE_TYPES.forEach(type => {
        const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
        if (templates !== undefined) {
            templates.forEach(template => {
                const { element: { content } } = template;
                // IE 11 doesn't support the iterable param Set constructor
                const styles = new Set();
                Array.from(content.querySelectorAll("style")).forEach((s) => {
                    styles.add(s);
                });
                removeNodesFromTemplate(template, styles);
            });
        }
    });
}
const shadyRenderSet = new Set();
const ensureStylesScoped = (fragment, template, scopeName) => {
    if (!shadyRenderSet.has(scopeName)) {
        shadyRenderSet.add(scopeName);
        const styleTemplate = document.createElement("template");
        Array.from(fragment.querySelectorAll("style")).forEach((s) => {
            styleTemplate.content.appendChild(s);
        });
        window.ShadyCSS.prepareTemplateStyles(styleTemplate, scopeName);
        removeStylesFromLitTemplates(scopeName);
        if (window.ShadyCSS.nativeShadow) {
            const style = styleTemplate.content.querySelector("style");
            if (style !== null) {
                fragment.insertBefore(style, fragment.firstChild);
                insertNodeIntoTemplate(template, style.cloneNode(true), template.element.content.firstChild);
            }
        }
    }
};
export function render(result, container, scopeName) {
    const templateFactory = shadyTemplateFactory(scopeName);
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
    instance.update(result.values);
    const host = container instanceof ShadowRoot ? container.host : undefined;
    if (host !== undefined && verifyShadyCSSVersion()) {
        ensureStylesScoped(fragment, template, scopeName);
        window.ShadyCSS.styleElement(host);
    }
    removeNodes(container, container.firstChild);
    container.appendChild(fragment);
}
//# sourceMappingURL=shady-render.js.map