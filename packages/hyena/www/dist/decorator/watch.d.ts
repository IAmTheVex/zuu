import { AbstractDecorator, IDecoration } from '@zuu/mirror';
export interface WatchParameters extends IDecoration {
}
export declare class WatchDecorator extends AbstractDecorator<WatchParameters> {
    constructor();
    annotate(instance: WatchParameters, target: any, key?: string): void;
}
export declare const Watch: MethodDecorator;
