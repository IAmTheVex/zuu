import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

}