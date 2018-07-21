import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class Post {

    @PrimaryColumn("int")
    id: number;

    @Column()
    title: string;
    
    @Column()
    categoryName: string;
    
    @Column()
    isNew: boolean = false;

}