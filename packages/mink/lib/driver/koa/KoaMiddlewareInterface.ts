export interface KoaMiddlewareInterface {
    use(context: any, next: (err?: any) => Promise<any>): Promise<any>;
}