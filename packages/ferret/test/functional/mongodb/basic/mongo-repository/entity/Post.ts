import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ObjectIdColumn} from "../../../../../../lib/decorator/columns/ObjectIdColumn";
import {ObjectID} from "../../../../../../lib/driver/mongodb/typings";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    text: string;

    // @Column(() => Counters)
    // counters: Counters;

}