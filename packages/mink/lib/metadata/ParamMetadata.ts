import {ValidatorOptions} from "class-validator";
import {ActionMetadata} from "./ActionMetadata";
import {ParamMetadataArgs} from "./args/ParamMetadataArgs";
import {ParamType} from "./types/ParamType";
import {ClassTransformOptions} from "class-transformer";
import {Action} from "../Action";

export class ParamMetadata {
    actionMetadata: ActionMetadata;
    object: any;
    method: string;
    index: number;
    type: ParamType;
    name: string;
    targetType?: any;
    targetName: string = "";
    isTargetObject: boolean = false;
    target: any;
    parse: boolean;
    required: boolean;
    transform: (action: Action, value?: any) => Promise<any>|any;
    extraOptions: any;
    classTransform?: ClassTransformOptions;
    validate?: boolean|ValidatorOptions;

    constructor(actionMetadata: ActionMetadata, args: ParamMetadataArgs) {
        this.actionMetadata = actionMetadata;

        this.target = args.object.constructor;
        this.method = args.method;
        this.extraOptions = args.extraOptions;
        this.index = args.index;
        this.type = args.type;
        this.name = args.name;
        this.parse = args.parse;
        this.required = args.required;
        this.transform = args.transform;
        this.classTransform = args.classTransform;
        this.validate = args.validate;
        
        if (args.explicitType) {
            this.targetType = args.explicitType;
        } else {
            const ParamTypes = (Reflect as any).getMetadata("design:paramtypes", args.object, args.method);
            if (typeof ParamTypes !== "undefined") {
                this.targetType = ParamTypes[args.index];
            }
        }

        if (this.targetType) {
            if (this.targetType instanceof Function && this.targetType.name) {
                this.targetName = this.targetType.name.toLowerCase();

            } else if (typeof this.targetType === "string") {
                this.targetName = this.targetType.toLowerCase();
            }
            this.isTargetObject = this.targetType instanceof Function || this.targetType.toLowerCase() === "object";
        }
    }

}
