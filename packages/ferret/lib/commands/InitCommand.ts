import {CommandUtils} from "./CommandUtils";
import {ObjectLiteral} from "../common/ObjectLiteral";
const chalk = require("chalk");
import * as path from "path";

export class InitCommand {
    command = "init";
    describe = "Generates initial Ferret project structure. " +
        "If name specified then creates files inside directory called as name. " +
        "If its not specified then creates files inside current directory.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the project directory."
            })
            .option("db", {
                alias: "database",
                describe: "Database type you'll use in your project."
            })
            .option("express", {
                describe: "Indicates if express should be included in the project."
            })
            .option("docker", {
                describe: "Set to true if docker-compose must be generated as well. False by default."
            });
    }

    async handler(argv: any) {
        try {
            const database = argv.database || "mysql";
            const isExpress = argv.express !== undefined ? true : false;
            const isDocker = argv.docker !== undefined ? true : false;
            const basePath = process.cwd() + (argv.name ? ("/" + argv.name) : "");
            const projectName = argv.name ? path.basename(argv.name) : undefined;
            await CommandUtils.createFile(basePath + "/package.json", InitCommand.getPackageJsonTemplate(projectName), false);
            if (isDocker)
                await CommandUtils.createFile(basePath + "/docker-compose.yml", InitCommand.getDockerComposeTemplate(database), false);
            await CommandUtils.createFile(basePath + "/.gitignore", InitCommand.getGitIgnoreFile());
            await CommandUtils.createFile(basePath + "/README.md", InitCommand.getReadmeTemplate({ docker: isDocker }), false);
            await CommandUtils.createFile(basePath + "/tsconfig.json", InitCommand.getTsConfigTemplate());
            await CommandUtils.createFile(basePath + "/ferret.config.json", InitCommand.getOrmConfigTemplate(database));
            await CommandUtils.createFile(basePath + "/lib/entity/User.ts", InitCommand.getUserEntityTemplate(database));
            await CommandUtils.createFile(basePath + "/lib/index.ts", InitCommand.getAppIndexTemplate(isExpress));
            await CommandUtils.createDirectories(basePath + "/lib/migration");

            // generate extra files for express application
            if (isExpress) {
                await CommandUtils.createFile(basePath + "/lib/routes.ts", InitCommand.getRoutesTemplate());
                await CommandUtils.createFile(basePath + "/lib/controller/UserController.ts", InitCommand.getControllerTemplate());
            }

            const packageJsonContents = await CommandUtils.readFile(basePath + "/package.json");
            await CommandUtils.createFile(basePath + "/package.json", InitCommand.appendPackageJson(packageJsonContents, database, isExpress));

            if (argv.name) {
                console.log(chalk.green(`Project created inside ${chalk.blue(basePath)} directory.`));

            } else {
                console.log(chalk.green(`Project created inside current directory.`));
            }

        } catch (err) {
            console.log(chalk.black.bgRed("Error during project initialization:"));
            console.error(err);
            process.exit(1);
        }
    }

    protected static getOrmConfigTemplate(database: string): string {
        const options: ObjectLiteral = { };
        switch (database) {
            case "mysql":
                Object.assign(options, {
                    type: "mysql",
                    host: "localhost",
                    port: 3306,
                    username: "test",
                    password: "test",
                    database: "test",
                });
                break;
            case "mariadb":
                Object.assign(options, {
                    type: "mariadb",
                    host: "localhost",
                    port: 3306,
                    username: "test",
                    password: "test",
                    database: "test",
                });
                break;
            case "sqlite":
                Object.assign(options, {
                    type: "sqlite",
                    "database": "database.sqlite",
                });
                break;
            case "postgres":
                Object.assign(options, {
                    "type": "postgres",
                    "host": "localhost",
                    "port": 5432,
                    "username": "test",
                    "password": "test",
                    "database": "test",
                });
                break;
            case "mssql":
                Object.assign(options, {
                    "type": "mssql",
                    "host": "localhost",
                    "username": "sa",
                    "password": "Admin12345",
                    "database": "tempdb",
                });
                break;
            case "oracle":
                Object.assign(options, {
                    "type": "oracle",
                    "host": "localhost",
                    "username": "system",
                    "password": "oracle",
                    "port": 1521,
                    "sid": "xe.oracle.docker",
                });
                break;
            case "mongodb":
                Object.assign(options, {
                    "type": "mongodb",
                    "database": "test",
                });
                break;
        }
        Object.assign(options, {
            synchronize: true,
            logging: false,
            entities: [
                "build/entity/**/*.js"
            ],
            migrations: [
                "build/migration/**/*.js"
            ],
            subscribers: [
                "build/subscriber/**/*.js"
            ],
            cli: {
                entitiesDir: "lib/entity",
                migrationsDir: "lib/migration",
                subscribersDir: "lib/subscriber"
            }
        });
        return JSON.stringify(options, undefined, 3);
    }

    protected static getTsConfigTemplate(): string {
        return JSON.stringify({
            compilerOptions: {
                lib: ["es5", "es6"],
                target: "es5",
                module: "commonjs",
                moduleResolution: "node",
                rootDir: "./lib",
                outDir: "./build",
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                sourceMap: true
            }
        }
        , undefined, 3);
    }

    protected static getGitIgnoreFile(): string {
        return `.idea/
.vscode/
node_modules/
build/
tmp/
temp/`;
    }

    protected static getUserEntityTemplate(database: string): string {
        return `import {Entity, ${ database === "mongodb" ? "ObjectIdColumn, ObjectID" : "PrimaryGeneratedColumn" }, Column} from "@zuu/ferret-orm";

@Entity()
export class User {

    ${ database === "mongodb" ? "@ObjectIdColumn()" : "@PrimaryGeneratedColumn()" }
    id: ${ database === "mongodb" ? "ObjectID" : "number" };

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
`;
    }

    protected static getRoutesTemplate(): string {
        return `import {UserController} from "./controller/UserController";

export const Routes = [{
    method: "get",
    route: "/users",
    controller: UserController,
    action: "all"
}, {
    method: "get",
    route: "/users/:id",
    controller: UserController,
    action: "one"
}, {
    method: "post",
    route: "/users",
    controller: UserController,
    action: "save"
}, {
    method: "delete",
    route: "/users",
    controller: UserController,
    action: "remove"
}];`;
    }

    protected static getControllerTemplate(): string {
        return `import {getRepository} from "@zuu/ferret-orm";
import {NextFunction, Request, Response} from "express";
import {User} from "../entity/User";

export class UserController {

    private userRepository = getRepository(User);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.find();
    }

    async one(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.findOne(request.params.id);
    }

    async save(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.save(request.body);
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        await this.userRepository.removeById(request.params.id);
    }

}`;
    }

    protected static getAppIndexTemplate(express: boolean): string {
        if (express) {
            return `import "reflect-metadata";
import {createConnection} from "@zuu/ferret-orm";
import * as express from "express";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import {Routes} from "./routes";
import {User} from "./entity/User";

createConnection().then(async connection => {

    // create express app
    const app = express();
    app.use(bodyParser.json());

    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
    });

    // setup express app here
    // ...

    // start express server
    app.listen(3000);

    // insert new users for test
    await connection.manager.save(connection.manager.create(User, {
        firstName: "Timber",
        lastName: "Saw",
        age: 27
    }));
    await connection.manager.save(connection.manager.create(User, {
        firstName: "Phantom",
        lastName: "Assassin",
        age: 24
    }));

    console.log("Express server has started on port 3000. Open http://localhost:3000/users to see results");

}).catch(error => console.log(error));
`;

        } else {
            return `import "reflect-metadata";
import {createConnection} from "@zuu/ferret-orm";
import {User} from "./entity/User";

createConnection().then(async connection => {

    console.log("Inserting a new user into the database...");
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    user.age = 25;
    await connection.manager.save(user);
    console.log("Saved a new user with id: " + user.id);
    
    console.log("Loading users from the database...");
    const users = await connection.manager.find(User);
    console.log("Loaded users: ", users);
     
    console.log("Here you can setup and run express/koa/any other framework.");
    
}).catch(error => console.log(error));
`;
        }
    }

    protected static getPackageJsonTemplate(projectName?: string): string {
        return JSON.stringify({
            name: projectName || "new-ferret-project",
            version: "0.0.1",
            description: "Awesome project developed with Ferret.",
            devDependencies: {
            },
            dependencies: {
            },
            scripts: {
            }
        }, undefined, 3);
    }

    protected static getDockerComposeTemplate(database: string): string {

        switch (database) {
            case "mysql":
                return `version: '3'
services:

  mysql:
    image: "mysql:5.7.10"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`;
            case "mariadb":
                return `version: '3'
services:

  mariadb:
    image: "mariadb:10.1.16"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`;
            case "postgres":
                return `version: '3'
services:

  postgres:
    image: "postgres:9.6.1"
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: "test"
      POSTGRES_PASSWORD: "test"
      POSTGRES_DB: "test"

`;
            case "sqlite":
                return `version: '3'
services:
`;
            case "oracle":
                throw new Error(`You cannot initialize a project with docker for Oracle driver yet.`); // todo: implement for oracle as well

            case "mssql":
                return `version: '3'
services:

  mssql:
    image: "microsoft/mssql-server-linux:rc2"
    ports:
      - "1433:1433"
    environment:
      SA_PASSWORD: "Admin12345"
      ACCEPT_EULA: "Y"

`;
            case "mongodb":
                return `version: '3'
services:

  mongodb:
    image: "mongo:3.4.1"
    container_name: "ferret-mongodb"
    ports:
      - "27017:27017"

`;
        }
        return "";
    }

    protected static getReadmeTemplate(options: { docker: boolean }): string {
        let template = `# Awesome Project Build with Ferret
        
Steps to run this project:

1. Run \`npm i\` command
`;

        if (options.docker) {
            template += `2. Run \`docker-compose up\` command
`;
        } else {
            template += `2. Setup database settings inside \`ferret.config.json\` file
`;
        }

        template += `3. Run \`npm start\` command
`;
        return template;
    }

    protected static appendPackageJson(packageJsonContents: string, database: string, express: boolean /*, docker: boolean*/): string {
        const packageJson = JSON.parse(packageJsonContents);

        if (!packageJson.devDependencies) packageJson.devDependencies = {};
        Object.assign(packageJson.devDependencies, {
            "@types/node": "^8.0.29",
            "typescript": "2.5.2"
        });

        if (!packageJson.dependencies) packageJson.dependencies = {};
        Object.assign(packageJson.dependencies, {
            "@zuu/ferret-orm": require("../../package.json").version,
            "reflect-metadata": "^0.1.10"
        });

        switch (database) {
            case "mysql":
            case "mariadb":
                packageJson.dependencies["mysql"] = "^2.14.1";
                break;
            case "postgres":
                packageJson.dependencies["pg"] = "^7.3.0";
                break;
            case "sqlite":
                packageJson.dependencies["sqlite3"] = "^3.1.10";
                break;
            case "oracle":
                packageJson.dependencies["oracledb"] = "^1.13.1";
                break;
            case "mssql":
                packageJson.dependencies["mssql"] = "^4.0.4";
                break;
            case "mongodb":
                packageJson.dependencies["mongodb"] = "^2.2.31";
                break;
        }

        if (express) {
            packageJson.dependencies["express"] = "^4.15.4";
            packageJson.dependencies["body-parser"] = "^1.18.1";
        }

        if (!packageJson.scripts) packageJson.scripts = {};
        Object.assign(packageJson.scripts, {
            start: /*(docker ? "docker-compose up && " : "") + */"node build/index.js"
        });
        return JSON.stringify(packageJson, undefined, 3);
    }

}
