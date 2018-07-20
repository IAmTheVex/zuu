export interface MiddlewareMetadataArgs {
    target: Function;
    global: boolean;
    priority: number;
    type: "before"|"after";

}