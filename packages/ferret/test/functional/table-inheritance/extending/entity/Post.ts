import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Content} from "./Content";

@Entity()
export class Post extends Content {

    @Column()
    text: string;

}