import { Entity } from "../../../../../lib/decorator/entity/Entity";
import { Column } from "../../../../../lib/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import { Counters } from "./Counters";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column(type => Counters)
    counters: Counters;

    @Column(type => Counters, { prefix: "testCounters" })
    otherCounters: Counters;

}
