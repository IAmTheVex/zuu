import { TemplateResult } from "../renderer/core";
import { render, html } from '../renderer/lib/renderer-extended';
import { isOnMountValid, OnMount } from './contracts/OnMount';
import { isOnDismountValid, OnDismount } from './contracts/OnDismount';
import { isUpdatable, Updateable } from './contracts/Updateable';
import { isOnWillUpdateValid, OnWillUpdate } from './contracts/OnWillUpdate';
import { isOnDidUpdateValid, OnDidUpdate } from './contracts/OnDidUpdate';
import { isOnWillRenderValid, OnWillRender } from "./contracts/OnWillRender";
import { isStyleable, Styleable } from "./contracts/Styleable";
import { isOnDidRenderValid, OnDidRender } from './contracts/OnDidRender';

export abstract class HyenaElement extends HTMLElement {
    protected shadowable: boolean = false;
    // protected me: { new (...args): T };

    public constructor() {
        super();
    }

    public abstract render(): TemplateResult;

    public query<T extends Element>(selector: string): T {
        if(this.shadowable) return this.shadowRoot.querySelector<T>(selector);
        else return this.querySelector<T>(selector);
    }

    private triggerUpdatePipeline() {
        if(isUpdatable(this)) {
            if(isOnWillUpdateValid(this)) {
                (<OnWillUpdate>(<any>this)).onWillUpdate();
            }
            (<Updateable>(<any>this)).update();
            if(isOnDidUpdateValid(this)) {
                (<OnDidUpdate>(<any>this)).onDidUpdate();
            }
        }   
    }

    private triggerRenderingPipeline() {
        if(isOnWillRenderValid(this)) {
            (<OnWillRender>(<any>this)).onWillRender();
        }

        let style = null;
        if(isStyleable(this)) {
            style = (<Styleable>(<any>this)).styling();
        }

        let content = html`
            ${style}
            ${this.render()}
        `;

        if(this.shadowable) {
            render(content, this.shadowRoot);
        } else {
            render(content, this);
        }

        if(isOnDidRenderValid(this)) {
            (<OnDidRender>(<any>this)).onDidRender();
        }
    }

    connectedCallback() {
        if(this.shadowable) {
            this.attachShadow({ mode: "open" });
        }

        if(isOnMountValid(this)) {
            (<OnMount>(<any>this)).onMount();
        }

        this.triggerUpdatePipeline();
        this.triggerRenderingPipeline();
    }

    disconnectedCallback() {
        if(isOnDismountValid(this)) {
            (<OnDismount>(<any>this)).onDismount();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        let key: string = name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }) + "Changed";
        let self = <any>this;
        if(typeof self[key] == 'function') {
            (<Function>self[key]).call(this, oldValue, newValue);
        }
        this.triggerUpdatePipeline();
        this.triggerRenderingPipeline();
    }
};