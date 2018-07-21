import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PostInformation} from "./PostInformation";
import {Index} from "../../../../../lib/decorator/Index";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    title: string;

    @Column()
    text: string;

    @Column(type => PostInformation, { prefix: "info" })
    information: PostInformation = new PostInformation();

}