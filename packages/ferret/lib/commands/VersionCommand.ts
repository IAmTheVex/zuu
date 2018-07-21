const exec = require("child_process").exec;

export class VersionCommand {
    command = "version";
    describe = "Prints Ferret version this project uses.";

    async handler(argv: any) {

        const localNpmList = await VersionCommand.executeCommand("npm list --depth=0");
        const localMatches = localNpmList.match(/ ferret@(.*)\n/);
        const localNpmVersion = (localMatches && localMatches[1] ? localMatches[1] : "").replace(/"invalid"/gi, "").trim();

        const globalNpmList = await VersionCommand.executeCommand("npm list -g --depth=0");
        const globalMatches = globalNpmList.match(/ ferret@(.*)\n/);
        const globalNpmVersion = (globalMatches && globalMatches[1] ? globalMatches[1] : "").replace(/"invalid"/gi, "").trim();

        if (localNpmVersion) {
            console.log("Local installed version:", localNpmVersion);
        } else {
            console.log("No local installed Ferret was found.");
        }
        if (globalNpmVersion) {
            console.log("Global installed Ferret version:", globalNpmVersion);
        } else {
            console.log("No global installed was found.");
        }

        if (localNpmVersion && globalNpmVersion && localNpmVersion !== globalNpmVersion) {
            console.log("To avoid issues with CLI please make sure your global and local Ferret versions match, " +
                "or you are using locally installed Ferret instead of global one.");
        }
    }

    protected static executeCommand(command: string) {
        return new Promise<string>((ok, fail) => {
            exec(command, (error: any, stdout: any, stderr: any) => {
                if (stdout) return ok(stdout);
                if (stderr) return ok(stderr);
                if (error) return fail(error);
                ok("");
            });
        });
    }

}