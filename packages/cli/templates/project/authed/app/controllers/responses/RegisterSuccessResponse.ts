import { User } from "../../model/entities/User";
import { Token } from "../../model/entities/Token";
import { ConnectResponse } from "./ConnectResponse";

export class RegisterSuccessResponse {
    public info: ConnectResponse;
    public token: string;
    public refresh: string;

    constructor(user: User, token: Token, refresh: Token) {
        this.info = new ConnectResponse(user);
        
        this.token = token.chars;
        this.refresh = refresh.chars;
    }
}