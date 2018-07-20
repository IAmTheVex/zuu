import "reflect-metadata";

export * from "./decorators";
export * from "./scalars";
export * from "./errors";
export * from "./interfaces";
export * from "./factory";

export { buildSchema, buildSchemaSync, BuildSchemaOptions } from "./utils/buildSchema";
export { useContainer } from "./utils/container";

export { PubSubEngine } from "graphql-subscriptions";
