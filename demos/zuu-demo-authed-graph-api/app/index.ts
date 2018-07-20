import { AuthedGraphQLController, Bootstrap, ZuuOptions } from "@zuu/bootstrap";
import { Action, UnauthorizedError } from '@zuu/mink';
import { Debugger, Runtime } from "@zuu/vet";
import { ConnectionContext } from "subscriptions-transport-ws";
import { AuthController } from './controllers/AuthController';
import { HomeController } from './controllers/HomeController';
import { ResponseFormatter } from './interceptors/ResponseFormatter';
import { ListeningEventListener } from './listeners/ListeningEventListener';
import { SubscriptionServerListeningEventListener } from './listeners/SubscriptionServerListeningEventListener';
import { ResponseTime } from "./middlewares/ResponseTime";
import { User } from './model/entities/User';
import { ExpressHandlebarsRenderer } from "./modules/ExpressHandlebarsRenderer";
import { AuthContextChecker } from './packages/context/AuthContextChecker';
import { HeadersContextFiller } from './packages/context/HeadersContextFiller';
import { Timer } from './packages/timer/Timer';
import { MeResolver } from './resolvers/MeResolver';
import { NoteResolver } from './resolvers/NoteResolver';

Debugger.deafults();

let tag = Debugger.tag("app-index");

let options: ZuuOptions = {
    server: {
        port: parseInt(process.env["PORT"]) || 4100,
        modules: [
            new ExpressHandlebarsRenderer({
                defaultLayout: "main"       
            })
        ]
    },
    currentUserChecker: async (action: Action): Promise<User> => {
        let token = action.request.headers["x-access-token"];
        return await AuthContextChecker.check(token);
    },
    graph: {
        contextFiller: async (user: User, headers: any): Promise<any> =>{
            return await HeadersContextFiller.fill(user, headers);
        },
        subscriptionCurrentUserChecker: async (connectionParams: Object, webSocket: WebSocket, context: ConnectionContext): Promise<any> => {
            let token = options['x-access-token'];
            let user = await AuthContextChecker.check(token);
            if (!user) throw new UnauthorizedError();

            return { user, ...(await HeadersContextFiller.fill(user, options)) };        
        }
    },
    listeners: [
        new ListeningEventListener,
        new SubscriptionServerListeningEventListener
    ],
    middlewares: [
        ResponseTime
    ],
    interceptors: [
        ResponseFormatter
    ],
    controllers: [
        HomeController,
        AuthController,
        AuthedGraphQLController
    ],
    resolvers: [
        MeResolver,
        NoteResolver
    ],
    cors: true
};

let timer = new Timer().reset();
Runtime.scoped(null, async _ => {
    Debugger.log(tag`Initialization began!`);
    let { app } = await Bootstrap.scope(options).run();
    return (typeof app != "undefined" && app != null);
})
.then(async result => {
    Debugger.log(tag`Initialization succeeded! Took ${timer.stop().diff()}ms!`);
})
.catch(Debugger.error);