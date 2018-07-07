import { ConnectionContext } from "subscriptions-transport-ws";
import { ConfigManager } from "@zuu/vet";

export interface GQLOptions {
    playground?: string,
    queryEndpoint?: string,
    subscriptionsEndpoint?: string,
    contextFiller?: (user, headers) => Promise<any> | any,
    subscriptionCurrentUserChecker?: (connectionParams: Object, webSocket: WebSocket, context: ConnectionContext) => Promise<any> | any
};

export class GQLHelper {
    public static queryPath;
    public static playground: string;
    public static subscriptionsPath: string;
    public static contextFiller: (user, headers) => Promise<any> | any = (user, headers) => { return {}; };
    public static subscriptionCurrentUserChecker?: (connectionParams: Object, webSocket: WebSocket, context: ConnectionContext) => Promise<any> | any;

    public static fill() {
        this.assist(ConfigManager.obtain("owl"));
    }

    public static assist(options: GQLOptions) {
        this.queryPath = options.queryEndpoint;
        this.subscriptionsPath = options.subscriptionsEndpoint;
        this.playground = options.playground;
        this.contextFiller = options.contextFiller || ((_, $) => { return {}; });
        this.subscriptionCurrentUserChecker = options.subscriptionCurrentUserChecker;         
    }
}