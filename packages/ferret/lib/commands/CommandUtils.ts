import * as fs from "fs";
import * as path from "path";
const mkdirp = require("mkdirp");

export class CommandUtils {

    static createDirectories(directory: string) {
        return new Promise((ok, fail) => mkdirp(directory, (err: any) => err ? fail(err) : ok()));
    }

    static async createFile(filePath: string, content: string, override: boolean = true): Promise<void> {
        await CommandUtils.createDirectories(path.dirname(filePath));
        return new Promise<void>((ok, fail) => {
            if (override === false && fs.existsSync(filePath))
                return ok();

            fs.writeFile(filePath, content, err => err ? fail(err) : ok());
        });
    }

    static async readFile(filePath: string): Promise<string> {
        return new Promise<string>((ok, fail) => {
            fs.readFile(filePath, (err, data) => err ? fail(err) : ok(data.toString()));
        });
    }


    static async fileExists(filePath: string) {
        return fs.existsSync(filePath);
    }
}