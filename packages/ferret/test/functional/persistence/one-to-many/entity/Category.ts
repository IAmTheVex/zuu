import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Post} from "./Post";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @Column()
    name: string;

}