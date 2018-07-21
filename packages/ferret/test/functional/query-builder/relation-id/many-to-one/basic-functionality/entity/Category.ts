import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {PostCategory} from "./PostCategory";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @OneToMany(type => PostCategory, postCategory => postCategory.category)
    posts: PostCategory[];

}