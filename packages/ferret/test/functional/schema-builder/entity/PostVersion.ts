import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../lib";
import {PrimaryColumn} from "../../../../lib/decorator/columns/PrimaryColumn";
import {Post} from "./Post";

@Entity()
export class PostVersion {

    @PrimaryColumn()
    id: number;

    @ManyToOne(type => Post)
    @JoinColumn({ referencedColumnName: "version" })
    post: Post;

    @Column()
    details: string;

}