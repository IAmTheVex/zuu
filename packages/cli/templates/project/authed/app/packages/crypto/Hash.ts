import { createHmac } from "crypto";
import { Singleton } from "@zuu/vet";

export enum HashingAlgorithm {
    SHA512
};

export class HashedPassword {
    constructor(public hash: string, public salt: string, public algo: HashingAlgorithm) {};
};

@Singleton
export class Hash {
    public update(password: string, salt: string, algo: HashingAlgorithm): HashedPassword {
        let hasher = createHmac('sha512', salt);
        hasher.update(password);
        let hash = hasher.digest('hex');
        return new HashedPassword(hash, salt, algo);
    }

    public same(input: string, check: HashedPassword): boolean {
        let hash = this.update(input, check.salt, check.algo).hash;
        return hash == check.hash;
    }

    public compile(password: HashedPassword): string {
        return 'sftw-' + password.salt + '-' + password.hash;
    }

    public decompile(password: string): HashedPassword {
        let components = password.split("-");
        if(components.length != 3) return null;
        return new HashedPassword(components[2], components[1], HashingAlgorithm.SHA512);   
    }
}