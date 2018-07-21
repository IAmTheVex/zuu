import {getMetadataArgsStorage} from "../../";
import {TransactionEntityMetadataArgs} from "../../metadata-args/TransactionEntityMetadataArgs";

export function TransactionManager(): Function {
    return function (object: Object, methodName: string, index: number) {

        getMetadataArgsStorage().transactionEntityManagers.push({
            target: object.constructor,
            methodName: methodName,
            index: index,
        } as TransactionEntityMetadataArgs);
    };
}
