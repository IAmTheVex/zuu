import { Interceptor, InterceptorInterface, Action } from "@zuu/mink";
import { Debugger } from '@zuu/vet';

let tag = Debugger.tag("response-formatter-interceptor");

@Interceptor()
export class ResponseFormatter implements InterceptorInterface {
    constructor() {
        Debugger.log(tag`Interceptor loaded!`);
    }
    
    intercept(action: Action, result: any) {
        action.request.time.end = Date.now();
        action.request.time.spent = Date.now() - action.request.time.start;
        
        if(!result.data) {
            result = { data: result };
        }
        result.meta = {
            headers: action.request.headers,
            body: action.request.body,
            query: action.request.query,
            params: action.request.params,
            time: { 
                now: Date.now(),
                start: action.request.time.start,
                spent: action.request.time.spent
            }
        };
        return result;
    }
}