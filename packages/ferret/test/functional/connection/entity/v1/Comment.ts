import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Index} from "../../../../../lib/decorator/Index";
import {Guest} from "./Guest";

@Entity()
@Index("author_and_title_unique", ["author", "title"], { unique: true })
export class Comment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    title: string;

    @Column()
    context: string;

    @OneToMany(type => Comment, comment => comment.relay)
    reference?: Comment;

    @ManyToOne(type => Comment, comment => comment.reference)
    relay?: Comment;

    @ManyToOne(type => Guest, guest => guest.comments)
    author: Guest;
}