import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {Unique} from "../../../../lib/decorator/Unique";
import {PrimaryColumn} from "../../../../lib/decorator/columns/PrimaryColumn";
import {Index} from "../../../../lib/decorator/Index";

@Entity()
@Unique(["name"])
@Index(["text"], { unique: true })
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    @Index({ unique: true })
    tag: string;

    @Column({ unique: true })
    description: string;

    @Column()
    text: string;

}