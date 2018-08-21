var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import "reflect-metadata";
import { Component } from "./decorator/component";
import { HyenaElement } from './element/element';
import { html } from "./renderer/lib/renderer-extended";
import { Property } from './decorator/property';
export var ValueChangeType;
(function (ValueChangeType) {
    ValueChangeType[ValueChangeType["INCREMENT"] = 0] = "INCREMENT";
    ValueChangeType[ValueChangeType["DECREMENT"] = 1] = "DECREMENT";
    ValueChangeType[ValueChangeType["INITIALIZATION"] = 2] = "INITIALIZATION";
    ValueChangeType[ValueChangeType["UNKNOWN"] = 3] = "UNKNOWN";
})(ValueChangeType || (ValueChangeType = {}));
;
export class ValueChangedEvent extends Event {
    constructor(oldValue, newValue) {
        super("valuechange");
        this.changeType = ValueChangeType.UNKNOWN;
        this.oldValue = oldValue;
        this.newValue = newValue;
        if (oldValue == null)
            this.changeType = ValueChangeType.INITIALIZATION;
        else if (oldValue < newValue)
            this.changeType = ValueChangeType.INCREMENT;
        else if (oldValue > newValue)
            this.changeType = ValueChangeType.DECREMENT;
    }
}
let Counter = class Counter extends HyenaElement {
    valueChanged(oldValue, newValue) {
        this.dispatchEvent(new ValueChangedEvent(oldValue, newValue));
    }
    minimumValueChanged(oldMin, newMin) {
        if (this.value <= newMin)
            this.value = newMin;
    }
    maximumValueChanged(oldMax, newMax) {
        if (this.value >= newMax)
            this.value = newMax;
    }
    increment() {
        let temp = this.value + 1;
        if (temp <= this.maximumValue)
            this.value = temp;
    }
    decrement() {
        console.log("derement");
        let temp = this.value - 1;
        if (temp >= this.minimumValue)
            this.value = temp;
    }
    onMount() {
        if (!this.minimumValue)
            this.minimumValue = 0;
        if (!this.maximumValue)
            this.maximumValue = 50;
        if (!this.value)
            this.value = Math.floor((this.minimumValue + this.maximumValue) / 2);
        if (this.value < this.minimumValue)
            this.value = this.minimumValue;
        if (this.value > this.maximumValue)
            this.value = this.maximumValue;
    }
    styling() {
        return html `
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
    render() {
        return html `
            <div>
                <button on-click=${e => this.decrement()}>-</button>
                <p>${this.value}</p>
                <button on-click=${e => this.increment()}>+</button>
            </div>
        `;
    }
};
__decorate([
    Property(),
    __metadata("design:type", Number)
], Counter.prototype, "minimumValue", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Counter.prototype, "maximumValue", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Counter.prototype, "value", void 0);
Counter = __decorate([
    Component({
        tag: "app-counter"
    })
], Counter);
export { Counter };
let TestElement = class TestElement extends HyenaElement {
    constructor() {
        super();
        this.shadowable = true;
    }
    handleCounterChange(event) {
        let counter = this.query("#counter");
        console.log(counter.value);
        if (event.changeType == ValueChangeType.INCREMENT)
            console.log("COUNTER WAS INCREMENTED!");
    }
    render() {
        return html `
            <app-counter id="counter" maximum-value="10" value="3" on-valuechange=${(e) => this.handleCounterChange(e)}></app-counter>
        `;
    }
};
TestElement = __decorate([
    Component({
        tag: "x-test"
    }),
    __metadata("design:paramtypes", [])
], TestElement);
//# sourceMappingURL=sketch.js.map