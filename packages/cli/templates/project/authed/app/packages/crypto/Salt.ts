import { randomBytes } from "crypto";
import { Singleton } from "@zuu/vet";

@Singleton
export class Salt {
    public random(length: number): string {
        return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
    }

    public secret(secret: string, length: number): string {
        return secret.replace(/ /ig, "$@") +  this.random(length);
    }
}