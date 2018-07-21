import { Controller, Get, Render } from "@zuu/mink";
import { Debugger } from '@zuu/vet';

let tag = Debugger.tag("home-controller");

@Controller("/")
export class HomeController {
    public constructor() {
        Debugger.log(tag`New instance created!`);
    }

    @Get()
    @Render("home")
    public index() {
        return {a: 124};
    }
}