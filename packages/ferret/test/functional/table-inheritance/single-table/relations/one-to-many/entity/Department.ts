import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {Accountant} from "./Accountant";

@Entity()
export class Department {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Accountant, accountant => accountant.departments)
    accountant: Accountant;

}
