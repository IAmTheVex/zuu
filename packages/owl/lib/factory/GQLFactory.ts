import { GraphQLSchema, graphql } from "graphql";
import { buildSchema } from "..";
import { PubSub, PubSubEngine } from "graphql-subscriptions";

export class GQLFactory {
    private static _schema: GraphQLSchema;
    private static _pubSub: PubSubEngine;

    public static get schema(): GraphQLSchema {
        return this._schema;
    }

    public static get pubSub(): PubSubEngine {
        return this._pubSub;
    }

    public static async setup(resolvers: Function[]) {
        this._pubSub = new PubSub();
        this._schema = await buildSchema({ resolvers, pubSub: this._pubSub });
    }

    public static async run(query: string, context?: Object, variables?: Object, operation?: string): Promise<any> {
        return await graphql(this._schema, query, undefined, context || { }, variables || { }, operation);
    }
}