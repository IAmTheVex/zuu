import { Singleton } from "@zuu/vet";

@Singleton
export class Cypher {
    public encode(data: string): string {
        return new Buffer(data, 'ascii').toString('base64');
    }

    public decode(data: string): string {
        return new Buffer(data, 'base64').toString('ascii');
    }

    public shuffle(input: string): string {
        return input.split('').sort( _ => 0.5 - Math.random()).join('');
    }
}