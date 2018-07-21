export interface ValueTransformer {

    to(value: any): any;

    from(value: any): any;

}
