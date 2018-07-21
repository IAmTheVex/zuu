import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

@Entity({ database: "secondDB" })
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}