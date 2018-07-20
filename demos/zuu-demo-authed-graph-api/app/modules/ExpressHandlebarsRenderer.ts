import { AbstractModule, LoadType, IBeforeHnadler } from "@zuu/bootstrap";
import { Application } from "express";
import * as hdbs from "express-handlebars";
import { Debugger } from '@zuu/vet';

let tag = Debugger.tag("express-handlebars-renderer")

export class ExpressHandlebarsRenderer extends AbstractModule implements IBeforeHnadler {
    public constructor(private options: ExphbsOptions = {}) {
        super([LoadType.BEFORE]);
    }

    public handleBefore(app: Application): Application {
        let exhdbs: Exphbs = hdbs.create(this.options);
        app.engine("handlebars", exhdbs.engine);
        app.set("view engine", "handlebars");
        Debugger.log(tag`Module loaded!`);
        return app;
    }
}