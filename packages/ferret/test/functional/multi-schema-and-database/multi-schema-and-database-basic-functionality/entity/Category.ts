import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Entity({schema: "guest"})
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    post: Post;

}