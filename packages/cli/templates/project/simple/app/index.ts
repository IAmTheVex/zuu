import { Bootstrap, ZuuOptions, GraphQLController } from "@zuu/bootstrap";
import { Debugger, Runtime } from "@zuu/vet";
import { HomeController } from './controllers/HomeController';
import { ExpressHandlebarsRenderer } from "./modules/ExpressHandlebarsRenderer";
import { Timer } from './packages/timer/Timer';
import { ResponseFormatter } from './interceptors/ResponseFormatter';
import { ResponseTime } from "./middlewares/ResponseTime";
import { ListeningEventListener } from './listeners/ListeningEventListener';
import { SubscriptionServerListeningEventListener } from './listeners/SubscriptionServerListeningEventListener';
import { TestResolver } from './resolvers/TestResolver';

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
        GraphQLController
    ],
    resolvers: [
        TestResolver
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