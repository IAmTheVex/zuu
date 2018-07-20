export interface Action {
    request: any;
    response: any;
    context?: any;
    next?: Function;

}
