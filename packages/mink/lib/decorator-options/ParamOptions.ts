import {ValidatorOptions} from "class-validator";
import {ClassTransformOptions} from "class-transformer";

export interface ParamOptions {
    required?: boolean;
    parse?: boolean;
    transform?: ClassTransformOptions;
    validate?: boolean|ValidatorOptions;
    type?: any;
    
}