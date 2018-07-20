export interface ExpressMiddlewareInterface {
    use(request: any, response: any, next: (err?: any) => any): any;
}