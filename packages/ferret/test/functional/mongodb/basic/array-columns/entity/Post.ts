import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ObjectIdColumn} from "../../../../../../lib/decorator/columns/ObjectIdColumn";
import {Counters} from "./Counters";
import {ObjectID} from "../../../../../../lib/driver/mongodb/typings";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column(type => Counters)
    counters: Counters[];

    @Column()
    names: string[];

    @Column()
    numbers: number[];

    @Column()
    booleans: boolean[];

    @Column(type => Counters)
    other1: Counters[];

    @Column(type => Counters)
    other2: Counters[];

}