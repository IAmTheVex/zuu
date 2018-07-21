import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, {
        cascade: true,
        onDelete: "SET NULL"
    })
    post?: Post|null|number;

    constructor(name: string, post?: Post) {
        this.name = name;
        if (post)
            this.post = post;
    }

}