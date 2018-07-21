import {Entity} from "../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../lib/decorator/columns/Column";

@Entity("view", { synchronize: false })
export class View {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

}