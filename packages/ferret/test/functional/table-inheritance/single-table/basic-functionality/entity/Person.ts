import {Column} from "../../../../../../lib/decorator/columns/Column";
import {TableInheritance} from "../../../../../../lib/decorator/entity/TableInheritance";
import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

@Entity()
@TableInheritance({ column: { name: "type", type: "varchar" } })
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
