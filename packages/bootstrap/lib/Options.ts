import { ConnectionOptions } from "../../ferret/build";
import { MinkOptions } from "../../mink/build";
import { AbstractEventListener } from "../../vet/build";
import { ConnectionContext } from "subscriptions-transport-ws";
import { AbstractModule } from "./module";
import { GQLOptions } from './GQLHelper';

export interface ZuuOptions extends MinkOptions {
    model?: ConnectionOptions,
    server?: {
        port?: number,
        modules?: AbstractModule[],
        ssl?: {
            port: number,
            credentials: {
                key: string | Buffer,
                cert: string | Buffer,
                ca: string | Buffer
            }
        }
    },
    graph?: GQLOptions,
    resolvers?: Function[],
    listeners?: AbstractEventListener<any>[]
}