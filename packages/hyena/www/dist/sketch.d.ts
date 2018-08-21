import "reflect-metadata";
import { HyenaElement } from './element/element';
import { OnMount } from '../www/dist/element/contracts/OnMount';
import { Styleable } from '../www/dist/element/contracts/Styleable';
export declare enum ValueChangeType {
    INCREMENT = 0,
    DECREMENT = 1,
    INITIALIZATION = 2,
    UNKNOWN = 3
}
export declare class ValueChangedEvent extends Event {
    changeType: ValueChangeType;
    oldValue: number;
    newValue: number;
    constructor(oldValue: number, newValue: number);
}
export declare class Counter extends HyenaElement implements Styleable, OnMount {
    minimumValue: number;
    maximumValue: number;
    value: number;
    valueChanged(oldValue: number, newValue: number): void;
    minimumValueChanged(oldMin: number, newMin: number): void;
    maximumValueChanged(oldMax: number, newMax: number): void;
    increment(): void;
    decrement(): void;
    onMount(): void;
    styling(): import("../../../../../../../Users/vex/p/zuu/packages/hyena/src/renderer/core").TemplateResult;
    render(): import("../../../../../../../Users/vex/p/zuu/packages/hyena/src/renderer/core").TemplateResult;
}
