import * as fs from "fs";
import * as path from "path";

let zup: any = require("zup");

export class TemplateGenerator {
    public static generateFile(source: string, destination: string, context: any, absolute: boolean = false) {
        if(!absolute) source = path.join(__dirname, `../../../templates/${source}`);
        let content = fs.readFileSync(source).toString();
        content = zup(content)(context);
        fs.writeFileSync(destination, content);
    }
}