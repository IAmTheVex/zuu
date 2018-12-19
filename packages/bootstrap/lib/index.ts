import { Application, Response, Request } from 'express';
import * as express from "express";
import expressPlaygroundMiddleware from "graphql-playground-middleware-express";

import { ZuuOptions } from './Options';
import { AbstractModule, ModuleLoader } from "./module";
import { useExpressServer } from "@zuu/mink";
import { GQLFactory } from "@zuu/owl";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { EventBus, AbstractEventListener } from "@zuu/vet";
import { ListeningEvent } from "./events/ListeningEvent";
import { createConnection, ConnectionOptions, Connection } from "@zuu/ferret";
import { ConnectionCreatedEvent } from "./events/ConnectionCreatedEvent";
import { SubscriptionServerListeningEvent } from "./events/SubscriptionServerListeningEvent";
import { createServer, Server } from "http";
import * as https from "https";
import { execute, subscribe } from "graphql";
import { GQLHelper } from './GQLHelper';

export * from "./events";
export * from "./module";
export * from "./Options";

export * from "./GQLHelper";

export class BootstrappedOptions {
    private _options: ZuuOptions;

    public constructor(options: ZuuOptions) {
        options = options || {};
        options.listeners = options.listeners || [];
        options.server = options.server || {};
        options.server.port = options.server.port || 4000;
    
        options.graph = options.graph || {};
        options.resolvers = options.resolvers || [];
        options.controllers = options.controllers || [];
    
        options.graph.queryEndpoint = options.graph.queryEndpoint || GQLHelper.queryPath;
        options.graph.subscriptionsEndpoint = options.graph.subscriptionsEndpoint || GQLHelper.subscriptionsPath;
        options.graph.playground = options.graph.playground || GQLHelper.playground;
        options.graph.contextFiller = options.graph.contextFiller || ((user, headers) => { return {}; });
        options.graph.subscriptionCurrentUserChecker = options.graph.subscriptionCurrentUserChecker;
     
        GQLHelper.contextFiller = options.graph.contextFiller;
        GQLHelper.subscriptionCurrentUserChecker = options.graph.subscriptionCurrentUserChecker;

        this._options = options;
    }

    public getOptions(): ZuuOptions {
        return this._options;
    }

    public async run(app?: Application): Promise<{ app: Application, server: Server, https?: https.Server, subscriptionServer?: SubscriptionServer }> {
        let options = this._options;

        for (let i = 0; i < options.listeners.length; i++) {
            EventBus.subscribe<any>(options.listeners[i]);
        }
    
        if (options.resolvers.length != 0)
            await GQLFactory.setup(options.resolvers);
    
        let connection: Connection;
        if (typeof options.model != "undefined") connection = await createConnection(<ConnectionOptions>options.model);
        else connection = await createConnection();
        EventBus.emit(new ConnectionCreatedEvent(connection));
    
        if (!app) app = express();
        let modules: AbstractModule[] = options.server.modules || [];
        ModuleLoader.loadMany(modules);
    
        ModuleLoader.before(app);
        useExpressServer(app, options);
        ModuleLoader.after(app);
    
        if (typeof options.graph.playground != "undefined" && options.graph.playground != null) {
            app.get(options.graph.playground, expressPlaygroundMiddleware({
                endpoint: options.graph.queryEndpoint || "/",
                subscriptionEndpoint: options.graph.subscriptionsEndpoint || "/"
            }));
        }
    
        let server = createServer(app);
        let httpsServer: https.Server = null;

        if(this._options.server.ssl) {
            httpsServer = https.createServer(this._options.server.ssl.credentials, app);
        }

        app.set("PORT", options.server.port);
        await (() => { return new Promise($ => { server.listen(options.server.port, _ => { $(); }); }); })();
        if(!!httpsServer){
            await (() => { return new Promise($ => { httpsServer.listen(options.server.ssl.port || 443, _ => { $(); }); }); })();
        }
        EventBus.emit(new ListeningEvent(app));
    
        let subscriptionServer: SubscriptionServer = undefined;
    
        if (typeof options.graph.subscriptionsEndpoint != "undefined" && options.graph.subscriptionsEndpoint != null && typeof GQLFactory.schema != "undefined" && GQLFactory.schema != null) {
            let onConnect = options.graph.subscriptionCurrentUserChecker;
            subscriptionServer = new SubscriptionServer(
                { schema: GQLFactory.schema, execute, subscribe, onConnect },
                { server: (!!httpsServer ? httpsServer : server), path: options.graph.subscriptionsEndpoint }
            );
            EventBus.emit(new SubscriptionServerListeningEvent(subscriptionServer));
        }
    
        return { app, server, https: httpsServer, subscriptionServer };
    }
}

export class Bootstrap {
    private static _current: BootstrappedOptions;
    
    public static getActiveBootstrap(): BootstrappedOptions {
        return this._current;
    }

    public static scope(options: ZuuOptions): BootstrappedOptions {
        if(!this._current)
            this._current = new BootstrappedOptions(options);
        return this._current;    
    } 
}

export * from "./controllers";