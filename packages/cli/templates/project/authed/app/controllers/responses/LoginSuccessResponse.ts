import { User } from "../../model/entities/User";
import { Token } from "../../model/entities/Token";

export class LoginSuccessResponse {
    public email: string;
    public id: string;
    public token: string;
    public refresh: string;

    constructor(user: User, token: Token, refresh: Token) {
        this.email = user.email;
        this.id = user.id;
        this.token = token.chars;
        this.refresh = refresh.chars;
    }
}