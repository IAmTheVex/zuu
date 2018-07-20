import { GraphQLScalarType } from "graphql";
import { ValidatorOptions } from "class-validator";
import { PubSubEngine, PubSub, PubSubOptions } from "graphql-subscriptions";

import { AuthChecker, AuthMode } from "../interfaces";
import { Middleware } from "../interfaces/Middleware";

export type DateScalarMode = "isoDate" | "timestamp";

export interface ScalarsTypeMap {
  type: Function;
  scalar: GraphQLScalarType;
}

export interface BuildContextOptions {
  dateScalarMode?: DateScalarMode;
  scalarsMap?: ScalarsTypeMap[];
  validate?: boolean | ValidatorOptions;
  authChecker?: AuthChecker<any, any>;
  authMode?: AuthMode;
  pubSub?: PubSubEngine | PubSubOptions;
  globalMiddlewares?: Array<Middleware<any>>;
}

export abstract class BuildContext {
  static dateScalarMode: DateScalarMode;
  static scalarsMaps: ScalarsTypeMap[];
  static validate: boolean | ValidatorOptions;
  static authChecker?: AuthChecker<any, any>;
  static authMode: AuthMode;
  static pubSub: PubSubEngine;
  static globalMiddlewares: Array<Middleware<any>>;

  static create(options: BuildContextOptions) {
    if (options.dateScalarMode !== undefined) {
      this.dateScalarMode = options.dateScalarMode;
    }
    if (options.scalarsMap !== undefined) {
      this.scalarsMaps = options.scalarsMap;
    }
    if (options.validate !== undefined) {
      this.validate = options.validate;
    }
    if (options.authChecker !== undefined) {
      this.authChecker = options.authChecker;
    }
    if (options.authMode !== undefined) {
      this.authMode = options.authMode;
    }
    if (options.pubSub !== undefined) {
      if ("eventEmitter" in options.pubSub) {
        this.pubSub = new PubSub(options.pubSub as PubSubOptions);
      } else {
        this.pubSub = options.pubSub as PubSubEngine;
      }
    }
    if (options.globalMiddlewares) {
      this.globalMiddlewares = options.globalMiddlewares;
    }
  }

  static reset() {
    this.dateScalarMode = "isoDate";
    this.scalarsMaps = [];
    this.validate = true;
    this.authChecker = undefined;
    this.authMode = "error";
    this.pubSub = new PubSub();
    this.globalMiddlewares = [];
  }
}

BuildContext.reset();
