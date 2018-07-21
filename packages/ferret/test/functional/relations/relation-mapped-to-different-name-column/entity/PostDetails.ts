import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class PostDetails {

    @PrimaryColumn()
    keyword: string;

}