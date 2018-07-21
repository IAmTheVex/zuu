import { User } from "../../model/entities/User";

export class ConnectResponse {
    public id: string;
    public email: string;
    public fullName: string;

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.fullName = user.fullName;
    }
}