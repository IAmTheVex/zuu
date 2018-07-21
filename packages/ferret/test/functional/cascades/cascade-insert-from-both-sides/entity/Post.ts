import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {PostDetails} from "./PostDetails";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    key: number;

    @OneToOne(type => PostDetails, details => details.post, {
        cascade: ["insert"]
    })
    @JoinColumn()
    details: PostDetails;

    @Column()
    title: string;

}