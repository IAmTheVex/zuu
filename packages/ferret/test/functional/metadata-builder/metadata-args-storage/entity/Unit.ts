import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";

export class Unit {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    type: string;

}