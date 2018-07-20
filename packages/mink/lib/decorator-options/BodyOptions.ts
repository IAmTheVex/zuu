import {ValidatorOptions} from "class-validator";
import {ClassTransformOptions} from "class-transformer";

export interface BodyOptions {
    required?: boolean;
    transform?: ClassTransformOptions;
    validate?: boolean|ValidatorOptions;
    options?: any;
    type?: any;
    
}