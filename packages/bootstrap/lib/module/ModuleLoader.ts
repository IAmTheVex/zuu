import { IBeforeHnadler } from "./IBeforeHandler";
import { IAfterHnadler } from "./IAfterHnadler";
import { AbstractModule } from "./AbstractModule";
import { LoadType } from "./LoadType";

import { Application } from "express";

export class ModuleLoader {
    private static beforeHandlers: IBeforeHnadler[] = [];
    private static afterHandlers: IAfterHnadler[] = [];

    public static load(module: AbstractModule) {
        if(module.types.includes(LoadType.BEFORE)) this.beforeHandlers.push(<IBeforeHnadler>(<any>module));
        else if(module.types.includes(LoadType.AFTER)) this.afterHandlers.push(<IAfterHnadler>(<any>module));        
    }

    public static loadMany(modules: AbstractModule[]) {
        for(let index = 0; index < modules.length; index ++) {
            this.load(modules[index]);
        }
    }

    public static before(app: Application) {
        for(let index = 0; index < this.beforeHandlers.length; index++) {
            app = this.beforeHandlers[index].handleBefore(app);
        }
    }

    public static after(app: Application) {
        for(let index = 0; index < this.afterHandlers.length; index++) {
            app = this.afterHandlers[index].handleAfter(app);
        }
    }
}