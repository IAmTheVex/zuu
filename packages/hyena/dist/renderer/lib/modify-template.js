import { isTemplatePartActive } from "../core";
const walkerNodeFilter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT;
export function removeNodesFromTemplate(template, nodesToRemove) {
    const { element: { content }, parts } = template;
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = 0;
    let part = parts[0];
    let nodeIndex = -1;
    let removeCount = 0;
    const nodesToRemoveInTemplate = [];
    let currentRemovingNode = null;
    while (walker.nextNode()) {
        nodeIndex++;
        const node = walker.currentNode;
        if (node.previousSibling === currentRemovingNode) {
            currentRemovingNode = null;
        }
        if (nodesToRemove.has(node)) {
            nodesToRemoveInTemplate.push(node);
            if (currentRemovingNode === null) {
                currentRemovingNode = node;
            }
        }
        if (currentRemovingNode !== null) {
            removeCount++;
        }
        while (part !== undefined && part.index === nodeIndex) {
            part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
            part = parts[++partIndex];
        }
    }
    nodesToRemoveInTemplate.forEach(n => n.parentNode.removeChild(n));
}
const countNodes = (node) => {
    let count = 1;
    const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
    while (walker.nextNode()) {
        count++;
    }
    return count;
};
const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
    for (let i = startIndex + 1; i < parts.length; i++) {
        const part = parts[i];
        if (isTemplatePartActive(part)) {
            return i;
        }
    }
    return -1;
};
export function insertNodeIntoTemplate(template, node, refNode = null) {
    const { element: { content }, parts } = template;
    if (refNode === null || refNode === undefined) {
        content.appendChild(node);
        return;
    }
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let insertCount = 0;
    let walkerIndex = -1;
    while (walker.nextNode()) {
        walkerIndex++;
        const walkerNode = walker.currentNode;
        if (walkerNode === refNode) {
            refNode.parentNode.insertBefore(node, refNode);
            insertCount = countNodes(node);
        }
        while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
            if (insertCount > 0) {
                while (partIndex !== -1) {
                    parts[partIndex].index += insertCount;
                    partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                }
                return;
            }
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }
    }
}
//# sourceMappingURL=modify-template.js.map