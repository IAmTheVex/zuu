import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ContentModule} from "./ContentModule";

@Entity()
export class Post extends ContentModule {

    @Column()
    title: string;

    @Column()
    text: string;

}