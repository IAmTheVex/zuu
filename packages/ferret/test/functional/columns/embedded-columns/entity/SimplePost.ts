import { Entity } from "../../../../../lib/decorator/entity/Entity";
import { Column } from "../../../../../lib/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import { SimpleCounters } from "./SimpleCounters";

@Entity()
export class SimplePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column(type => SimpleCounters)
    counters: SimpleCounters;
}
