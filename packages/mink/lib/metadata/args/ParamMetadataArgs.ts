import {ValidatorOptions} from "class-validator";
import {ClassTransformOptions} from "class-transformer";
import {ParamType} from "../types/ParamType";

export interface ParamMetadataArgs {
    object: any;
    method: string;
    index: number;
    type: ParamType;
    name?: string;
    parse: boolean;
    required: boolean;

    transform?: (value?: any, request?: any, response?: any) => Promise<any>|any;

    extraOptions?: any;
    classTransform?: ClassTransformOptions;
    validate?: boolean|ValidatorOptions;
    explicitType?: any;

}