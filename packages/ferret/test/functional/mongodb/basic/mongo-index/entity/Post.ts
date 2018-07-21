import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ObjectIdColumn} from "../../../../../../lib/decorator/columns/ObjectIdColumn";
import {Index} from "../../../../../../lib/decorator/Index";
import {ObjectID} from "../../../../../../lib/driver/mongodb/typings";

@Entity()
@Index(["title", "name"])
@Index(() => ({ title: -1, name: -1, count: 1 }))
@Index("title_name_count", () => ({ title: 1, name: 1, count: 1 }))
@Index("title_name_count_reversed", () => ({ title: -1, name: -1, count: -1 }))
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @Index()
    title: string;

    @Column()
    @Index()
    name: string;

    @Column()
    @Index({ unique: true })
    count: number;

}