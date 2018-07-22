import "reflect-metadata";
import {Get} from "../../lib/decorator/Get";
import { createExpressServer, createKoaServer, getMetadataArgsStorage, NotAcceptableError } from "../../lib/index";
import {assertRequest} from "./test-utils";
import {JsonController} from "../../lib/decorator/JsonController";
import {Authorized} from "../../lib/decorator/Authorized";
import {Action} from "../../lib/Action";
import {MinkOptions} from "../../lib/MinkOptions";
const chakram = require("chakram");
const expect = chakram.expect;

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

describe("Controller responds with value when Authorization succeeds (async)", function () {

    before(() => {
        getMetadataArgsStorage().reset();

        @JsonController()
        class AuthController {

            @Authorized()
            @Get("/auth1")
            auth1() {
                return { test: "auth1" };
            }

            @Authorized(["role1"])
            @Get("/auth2")
            auth2() {
                return { test: "auth2" };
            }

            @Authorized()
            @Get("/auth3")
            async auth3() {
                await sleep(10);
                return { test: "auth3" };
            }

        }
    });

    const serverOptions: MinkOptions = {
        authorizationChecker: async (action: Action, roles?: string[]) => {
            await sleep(10);
            return true;
        }
    };

    let expressApp: any;
    before(done => {
        const server = createExpressServer(serverOptions);
        expressApp = server.listen(3001, done);
    });
    after(done => expressApp.close(done));

    let koaApp: any;
    before(done => {
        const server = createKoaServer(serverOptions);
        koaApp = server.listen(3002, done);
    });
    after(done => koaApp.close(done));

    describe("without roles", () => {
        assertRequest([3001, 3002], "get", "auth1", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.eql({ test: "auth1" });
        });
    });

    describe("with roles", () => {
        assertRequest([3001, 3002], "get", "auth2", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.eql({ test: "auth2" });
        });
    });

    describe("async", () => {
        assertRequest([3001, 3002], "get", "auth3", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.eql({ test: "auth3" });
        });
    });

});

describe("Controller responds with value when Authorization succeeds (sync)", function () {
    
    before(() => {
        getMetadataArgsStorage().reset();

        @JsonController()
        class AuthController {

            @Authorized()
            @Get("/auth1")
            auth1() {
                return { test: "auth1" };
            }

            @Authorized(["role1"])
            @Get("/auth2")
            auth2() {
                return { test: "auth2" };
            }

            @Authorized()
            @Get("/auth3")
            async auth3() {
                await sleep(10);
                return { test: "auth3" };
            }

        }
    });

    const serverOptions: MinkOptions = {
        authorizationChecker: (action: Action, roles?: string[]) => {
            return true;
        }
    };

    let expressApp: any;
    before(done => {
        const server = createExpressServer(serverOptions);
        expressApp = server.listen(3001, done);
    });
    after(done => expressApp.close(done));

    let koaApp: any;
    before(done => {
        const server = createKoaServer(serverOptions);
        koaApp = server.listen(3002, done);
    });
    after(done => koaApp.close(done));

    describe("without roles", () => {
        assertRequest([3001, 3002], "get", "auth1", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.eql({ test: "auth1" });
        });
    });

    describe("with roles", () => {
        assertRequest([3001, 3002], "get", "auth2", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.eql({ test: "auth2" });
        });
    });

    describe("async", () => {
        assertRequest([3001, 3002], "get", "auth3", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.eql({ test: "auth3" });
        });
    });

});

describe("Authorized Decorators Http Status Code", function () {

    before(() => {
        getMetadataArgsStorage().reset();

        @JsonController()
        class AuthController {

            @Authorized()
            @Get("/auth1")
            auth1() {
                return {test: "auth1"};
            }

            @Authorized(["role1"])
            @Get("/auth2")
            auth2() {
                return {test: "auth2"};
            }

        }
    });

    const serverOptions: MinkOptions = {
        authorizationChecker: async (action: Action, roles?: string[]) => {
            return false;
        }
    };

    let expressApp: any;
    before(done => {
        const server = createExpressServer(serverOptions);
        expressApp = server.listen(3001, done);
    });
    after(done => expressApp.close(done));

    let koaApp: any;
    before(done => {
        const server = createKoaServer(serverOptions);
        koaApp = server.listen(3002, done);
    });
    after(done => koaApp.close(done));

    describe("without roles", () => {
        assertRequest([3001, 3002], "get", "auth1", response => {
            expect(response).to.have.status(401);
        });
    });

    describe("with roles", () => {
        assertRequest([3001, 3002], "get", "auth2", response => {
            expect(response).to.have.status(403);
        });
    });

});

describe("Authorization checker allows to throw (async)", function() {
    before(() => {
        // reset metadata args storage
        getMetadataArgsStorage().reset();

        @JsonController()
        class AuthController {
            @Authorized()
            @Get("/auth1")
            auth1() {
                return { test: "auth1" };
            }
        }
    });

    const serverOptions: MinkOptions = {
        authorizationChecker: async (action: Action, roles?: string[]) => {
            throw new NotAcceptableError("Custom Error");
        },
    };

    let expressApp: any;
    before(done => {
        const server = createExpressServer(serverOptions);
        expressApp = server.listen(3001, done);
    });
    after(done => expressApp.close(done));

    let koaApp: any;
    before(done => {
        const server = createKoaServer(serverOptions);
        koaApp = server.listen(3002, done);
    });
    after(done => koaApp.close(done));

    describe("custom errors", () => {
        assertRequest([3001, 3002], "get", "auth1", response => {
            expect(response).to.have.status(406);
            expect(response.body).to.have.property("name", "NotAcceptableError");
            expect(response.body).to.have.property("message", "Custom Error");
        });
    });
});

describe("Authorization checker allows to throw (sync)", function() {
    before(() => {
        getMetadataArgsStorage().reset();

        @JsonController()
        class AuthController {
            @Authorized()
            @Get("/auth1")
            auth1() {
                return { test: "auth1" };
            }
        }
    });

    const serverOptions: MinkOptions = {
        authorizationChecker: (action: Action, roles?: string[]) => {
            throw new NotAcceptableError("Custom Error");
        },
    };

    let expressApp: any;
    before(done => {
        const server = createExpressServer(serverOptions);
        expressApp = server.listen(3001, done);
    });
    after(done => expressApp.close(done));

    let koaApp: any;
    before(done => {
        const server = createKoaServer(serverOptions);
        koaApp = server.listen(3002, done);
    });
    after(done => koaApp.close(done));

    describe("custom errors", () => {
        assertRequest([3001, 3002], "get", "auth1", response => {
            expect(response).to.have.status(406);
            expect(response.body).to.have.property("name", "NotAcceptableError");
            expect(response.body).to.have.property("message", "Custom Error");
        });
    });
});