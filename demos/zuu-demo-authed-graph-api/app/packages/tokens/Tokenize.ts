import { Singleton, Configuration } from "@zuu/vet";
import { TokenScope } from "./TokenScope";
import { SecurityConfig } from "../../configs/Security";
import { Token } from "../../model/entities/Token";

import * as jwt from "jsonwebtoken";

@Singleton
export class Tokenize {
    @Configuration("security") private securityConfig: SecurityConfig;

    private static _instance: Tokenize;

    public constructor() {
        Tokenize._instance = this;
    }

    public static instance(): Tokenize {
        if(!this._instance)
            return new Tokenize();

        return this._instance;
    }

    public async create(target: string, scope: TokenScope, expires: boolean = true): Promise<Token> {
        let token = new Token();
        token.scope = scope;
        token.target = target;
        await token.save();
        let payload = {
            target, scope,
            id: token.id
        };

        let chars; 
        if(!expires) chars = await jwt.sign(payload, this.securityConfig.token.secret, { expiresIn: this.securityConfig.token.expires });
        else chars = await await jwt.sign(payload, this.securityConfig.token.secret);
        token.chars = chars;
        await token.save();
        
        return token;
    }

    public async find(chars: string, scope: TokenScope): Promise<Token> {
        try {
            let decompile = await jwt.verify(chars, this.securityConfig.token.secret);
        } catch(ex) {
            return null;
        }

        let token = await Token.findOne({ chars, scope });
        if(!token) return null;
        return token;
    }
}