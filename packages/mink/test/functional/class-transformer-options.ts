import "reflect-metadata";
import {JsonController} from "../../lib/decorator/JsonController";
import {createExpressServer, createKoaServer, getMetadataArgsStorage} from "../../lib/index";
import {assertRequest} from "./test-utils";
import {Expose} from "class-transformer";
import {defaultMetadataStorage} from "class-transformer/storage";
import {Get} from "../../lib/decorator/Get";
import {QueryParam} from "../../lib/decorator/QueryParam";
import {ResponseClassTransformOptions} from "../../lib/decorator/ResponseClassTransformOptions";
import {MinkOptions} from "../../lib/MinkOptions";
const chakram = require("chakram");
const expect = chakram.expect;

describe("class transformer options", () => {

    class UserFilter {
        keyword: string;
    }

    class UserModel {
        id: number;
        _firstName: string;
        _lastName: string;

        @Expose()
        get name(): string {
            return this._firstName + " " + this._lastName;
        }
    }

    after(() => {
        defaultMetadataStorage.clear();
    });

    describe("should not use any options if not set", () => {

        let requestFilter: any;
        beforeEach(() => {
            requestFilter = undefined;
        });

        before(() => {
            getMetadataArgsStorage().reset();

            @JsonController()
            class UserController {

                @Get("/user")
                getUsers(@QueryParam("filter") filter: UserFilter): any {
                    requestFilter = filter;
                    const user = new UserModel();
                    user.id = 1;
                    user._firstName = "Umed";
                    user._lastName = "Khudoiberdiev";
                    return user;
                }

            }
        });

        let expressApp: any, koaApp: any;
        before(done => expressApp = createExpressServer().listen(3001, done));
        after(done => expressApp.close(done));
        before(done => koaApp = createKoaServer().listen(3002, done));
        after(done => koaApp.close(done));

        assertRequest([3001, 3002], "get", "user?filter={\"keyword\": \"Um\", \"__somethingPrivate\": \"blablabla\"}", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.eql({
                id: 1,
                _firstName: "Umed",
                _lastName: "Khudoiberdiev",
                name: "Umed Khudoiberdiev"
            });
            expect(requestFilter).to.be.instanceOf(UserFilter);
            expect(requestFilter).to.be.eql({
                keyword: "Um",
                __somethingPrivate: "blablabla",
            });
        });
    });

    describe("should apply global options", () => {

        let requestFilter: any;
        beforeEach(() => {
            requestFilter = undefined;
        });

        before(() => {
            getMetadataArgsStorage().reset();

            @JsonController()
            class ClassTransformUserController {

                @Get("/user")
                getUsers(@QueryParam("filter") filter: UserFilter): any {
                    requestFilter = filter;
                    const user = new UserModel();
                    user.id = 1;
                    user._firstName = "Umed";
                    user._lastName = "Khudoiberdiev";
                    return user;
                }

            }
        });

        const options: MinkOptions = {
            classToPlainTransformOptions: {
                excludePrefixes: ["_"]
            },
            plainToClassTransformOptions: {
                excludePrefixes: ["__"]
            }
        };

        let expressApp: any, koaApp: any;
        before(done => expressApp = createExpressServer(options).listen(3001, done));
        after(done => expressApp.close(done));
        before(done => koaApp = createKoaServer(options).listen(3002, done));
        after(done => koaApp.close(done));

        assertRequest([3001, 3002], "get", "user?filter={\"keyword\": \"Um\", \"__somethingPrivate\": \"blablabla\"}", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.eql({
                id: 1,
                name: "Umed Khudoiberdiev"
            });
            expect(requestFilter).to.be.instanceOf(UserFilter);
            expect(requestFilter).to.be.eql({
                keyword: "Um"
            });
        });
    });

    describe("should apply local options", () => {

        let requestFilter: any;
        beforeEach(() => {
            requestFilter = undefined;
        });

        before(() => {
            getMetadataArgsStorage().reset();

            @JsonController()
            class ClassTransformUserController {

                @Get("/user")
                @ResponseClassTransformOptions({ excludePrefixes: ["_"] })
                getUsers(@QueryParam("filter", { transform: { excludePrefixes: ["__"] } }) filter: UserFilter): any {
                    requestFilter = filter;
                    const user = new UserModel();
                    user.id = 1;
                    user._firstName = "Umed";
                    user._lastName = "Khudoiberdiev";
                    return user;
                }

            }
        });

        let expressApp: any, koaApp: any;
        before(done => expressApp = createExpressServer().listen(3001, done));
        after(done => expressApp.close(done));
        before(done => koaApp = createKoaServer().listen(3002, done));
        after(done => koaApp.close(done));

        assertRequest([3001, 3002], "get", "user?filter={\"keyword\": \"Um\", \"__somethingPrivate\": \"blablabla\"}", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.eql({
                id: 1,
                name: "Umed Khudoiberdiev"
            });
            expect(requestFilter).to.be.instanceOf(UserFilter);
            expect(requestFilter).to.be.eql({
                keyword: "Um"
            });
        });
    });

});