import { Middleware, ExpressMiddlewareInterface } from "@zuu/mink";
import { Debugger } from '@zuu/vet';

let tag = Debugger.tag("response-time-middleware");

@Middleware({ type: "before" })
export class ResponseTime implements ExpressMiddlewareInterface {
    constructor() {
        Debugger.log(tag`Middleware loaded!`);
    }

    use(request: any, response: any, next: (err?: any) => void) {
        request.time = { start: Date.now() };
        next();
    }
}