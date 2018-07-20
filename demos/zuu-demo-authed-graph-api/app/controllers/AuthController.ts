import { Body, CurrentUser, Get, HeaderParam, JsonController, Post } from "@zuu/mink";
import { Configuration, Inject } from "@zuu/vet";
import { SecurityConfig } from "../configs/Security";
import { AccountDoesNotExistError } from "../errors/AccountDoesNotExistError";
import { EmailIsNotUniqueError } from "../errors/EmailIsNotUniqueError";
import { InvalidPasswordError } from "../errors/InvalidPasswordError";
import { InvalidTokenError } from "../errors/InvalidTokenError";
import { User } from "../model/entities/User";
import { Cypher } from "../packages/crypto/Cypher";
import { Hash, HashingAlgorithm } from "../packages/crypto/Hash";
import { Salt } from "../packages/crypto/Salt";
import { Tokenize } from "../packages/tokens/Tokenize";
import { TokenScope } from "../packages/tokens/TokenScope";
import { LoginBody } from "./bodies/LoginBody";
import { RegisterBody } from "./bodies/RegisterBody";
import { ConnectResponse } from "./responses/ConnectResponse";
import { LoginSuccessResponse } from "./responses/LoginSuccessResponse";
import { RegisterSuccessResponse } from "./responses/RegisterSuccessResponse";

@JsonController("/api/auth")
export class AuthController {
    @Inject private salt: Salt;
    @Inject private cypher: Cypher;
    @Inject private hash: Hash;
    @Inject private tokenize: Tokenize;

    @Configuration("security") private securityConfig: SecurityConfig;

    private saltLength: number;
    private saltSecret: string;

    public constructor() {
        this.saltLength = this.securityConfig.hash.salt.length;
        this.saltSecret = this.securityConfig.hash.salt.secret;
    }

    @Post("/register")
    public async register(@Body({required: true, validate: true}) register: RegisterBody) {
        let salt = this.salt.secret(this.cypher.shuffle(this.saltSecret), this.saltLength);
        let hashedPassword = this.hash.update(register.password, salt, HashingAlgorithm.SHA512);
        let compiledPassword = this.hash.compile(hashedPassword);
        let encodedPassword = this.cypher.encode(compiledPassword);

        let user = new User(register.email, encodedPassword);
        user.fullName = register.fullName;

        try {
            await user.save();            
        } catch(ex) {
            console.log(ex);
            throw new EmailIsNotUniqueError(register.email);
        }

        let token = await this.tokenize.create(user.id, TokenScope.AUTH);
        let refresh = await this.tokenize.create(user.id, TokenScope.REFRESH, false);
        
        return new RegisterSuccessResponse(user, token, refresh);
    }

    @Post("/login")
    public async login(@Body({required: true, validate: true}) login: LoginBody) {
        let user = await User.findOne({ email: login.email })
        if(!user) throw new AccountDoesNotExistError(login.email);

        let decodedPassword = this.cypher.decode(user.password);
        let decompiledPassword = this.hash.decompile(decodedPassword);
        if(!this.hash.same(login.password, decompiledPassword)) throw new InvalidPasswordError(login.email);

        let token = await this.tokenize.create(user.id, TokenScope.AUTH);
        let refresh = await this.tokenize.create(user.id, TokenScope.REFRESH, false);

        return new LoginSuccessResponse(user, token, refresh);
    }

    @Get("/")
    public async connect(@CurrentUser({required: true}) user: User) {
        return new ConnectResponse(user);
    }

    @Get("/refresh")
    public async refresh(@HeaderParam("x-refresh-token", {required: true}) token: string) {
        let refreshToken = await this.tokenize.find(token, TokenScope.REFRESH);
        if(!refreshToken) throw new InvalidTokenError(token);

        let user = await User.findOne(refreshToken.target);
        let accessToken = await this.tokenize.create(user.id, TokenScope.AUTH);
        return new LoginSuccessResponse(user, accessToken, refreshToken);
    }
}