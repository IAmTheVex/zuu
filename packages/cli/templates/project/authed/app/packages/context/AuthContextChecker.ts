import { User } from "../../model/entities/User";
import { Tokenize } from "../tokens/Tokenize";
import { TokenScope } from "../tokens/TokenScope";

import { InvalidTokenError } from "../../errors/InvalidTokenError";
import { AccountDoesNotExistError } from "../../errors/AccountDoesNotExistError";

export class AuthContextChecker {

    public static async check(token: string): Promise<User> {
        if(!token) return null;

        let authToken = await Tokenize.instance().find(token, TokenScope.AUTH);
        if(!authToken) throw new InvalidTokenError(token);
        
        let user = await User.findOne(authToken.target);
        if(!user) throw new AccountDoesNotExistError(authToken.target);
        
        return user;
    }
}