import {DefaultNamingStrategy} from "../../../../lib/naming-strategy/DefaultNamingStrategy";
import {NamingStrategyInterface} from "../../../../lib/naming-strategy/NamingStrategyInterface";

export class SecondCustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? customName.toLowerCase() : className.toLowerCase();
    }
    
}