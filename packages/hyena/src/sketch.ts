import "reflect-metadata";
import { Component } from "./decorator/component";
import { HyenaElement } from './element/element';
import { html } from "./renderer/lib/renderer-extended";
import { Property } from './decorator/property';
import { Watch } from "./decorator/watch";
import { Updateable } from '../www/dist/element/contracts/Updateable';
import { OnMount } from '../www/dist/element/contracts/OnMount';
import { Styleable } from '../www/dist/element/contracts/Styleable';

export enum ValueChangeType {
    INCREMENT,
    DECREMENT,
    INITIALIZATION,
    UNKNOWN
};

export class ValueChangedEvent extends Event {
    public changeType: ValueChangeType = ValueChangeType.UNKNOWN;
    public oldValue: number;
    public newValue: number;

    constructor(oldValue: number, newValue: number){ 
        super("valuechange");

        this.oldValue = oldValue;
        this.newValue = newValue;

        if(oldValue == null) this.changeType = ValueChangeType.INITIALIZATION;
        else if(oldValue < newValue) this.changeType = ValueChangeType.INCREMENT;
        else if(oldValue > newValue) this.changeType = ValueChangeType.DECREMENT;
    }
}

@Component({
    tag: "app-counter"
})
export class Counter extends HyenaElement implements Styleable, OnMount {
    @Property() minimumValue: number;
    @Property() maximumValue: number;
    @Property() value: number;

    public valueChanged(oldValue: number, newValue: number) {
        this.dispatchEvent(new ValueChangedEvent(oldValue, newValue));
    }

    public minimumValueChanged(oldMin: number, newMin: number) {
        if(this.value <= newMin) this.value = newMin;
    }

    public maximumValueChanged(oldMax: number, newMax: number) {
        if(this.value >= newMax) this.value = newMax;
    }

    public increment() {
        let temp = this.value + 1;
        if(temp <= this.maximumValue) this.value = temp;
    }

    public decrement() {
        console.log("derement");

        let temp = this.value - 1;
        if(temp >= this.minimumValue) this.value = temp;
    }

    public onMount() {
        if(!this.minimumValue) this.minimumValue = 0;
        if(!this.maximumValue) this.maximumValue = 50;

        if(!this.value) this.value = Math.floor((this.minimumValue + this.maximumValue) / 2);
    
        if(this.value < this.minimumValue) this.value = this.minimumValue;
        if(this.value > this.maximumValue) this.value = this.maximumValue;
    }

    public styling() {
        return html`
            <style>
                :host div {
                    display: flex !important;
                    color: red;
                }

                :host div p {
                    margin-left: 25px;
                    margin-right: 25px;
                    font-size: 30px;
                }

                :host div button {
                    font-size: 30px;
                }
            </style>
        `;
    }

    public render() {
        return html`
            <div>
                <button on-click=${e => this.decrement()}>-</button>
                <p>${this.value}</p>
                <button on-click=${e => this.increment()}>+</button>
            </div>
        `;
    }
}

@Component({
    tag: "x-test"
})
class TestElement extends HyenaElement {
    constructor() {
        super();
        this.shadowable = true;
    }

    public handleCounterChange(event: ValueChangedEvent) {
        let counter: Counter = this.query("#counter");
        console.log(counter.value);
        if(event.changeType == ValueChangeType.INCREMENT) console.log("COUNTER WAS INCREMENTED!");
    }

    public render() {
        return html`
            <app-counter id="counter" maximum-value="10" value="3" on-valuechange=${(e) => this.handleCounterChange(e)}></app-counter>
        `;
    }
}