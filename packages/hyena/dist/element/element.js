import { render, html } from '../renderer/lib/renderer-extended';
import { isOnMountValid } from './contracts/OnMount';
import { isOnDismountValid } from './contracts/OnDismount';
import { isUpdatable } from './contracts/Updateable';
import { isOnWillUpdateValid } from './contracts/OnWillUpdate';
import { isOnDidUpdateValid } from './contracts/OnDidUpdate';
import { isOnWillRenderValid } from "./contracts/OnWillRender";
import { isStyleable } from "./contracts/Styleable";
import { isOnDidRenderValid } from './contracts/OnDidRender';
export class HyenaElement extends HTMLElement {
    // protected me: { new (...args): T };
    constructor() {
        super();
        this.shadowable = false;
    }
    query(selector) {
        if (this.shadowable)
            return this.shadowRoot.querySelector(selector);
        else
            return this.querySelector(selector);
    }
    triggerUpdatePipeline() {
        if (isUpdatable(this)) {
            if (isOnWillUpdateValid(this)) {
                this.onWillUpdate();
            }
            this.update();
            if (isOnDidUpdateValid(this)) {
                this.onDidUpdate();
            }
        }
    }
    triggerRenderingPipeline() {
        if (isOnWillRenderValid(this)) {
            this.onWillRender();
        }
        let style = null;
        if (isStyleable(this)) {
            style = this.styling();
        }
        let content = html `
            ${style}
            ${this.render()}
        `;
        if (this.shadowable) {
            render(content, this.shadowRoot);
        }
        else {
            render(content, this);
        }
        if (isOnDidRenderValid(this)) {
            this.onDidRender();
        }
    }
    connectedCallback() {
        if (this.shadowable) {
            this.attachShadow({ mode: "open" });
        }
        if (isOnMountValid(this)) {
            this.onMount();
        }
        this.triggerUpdatePipeline();
        this.triggerRenderingPipeline();
    }
    disconnectedCallback() {
        if (isOnDismountValid(this)) {
            this.onDismount();
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        let key = name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }) + "Changed";
        let self = this;
        if (typeof self[key] == 'function') {
            self[key].call(this, oldValue, newValue);
        }
        this.triggerUpdatePipeline();
        this.triggerRenderingPipeline();
    }
}
;
//# sourceMappingURL=element.js.map