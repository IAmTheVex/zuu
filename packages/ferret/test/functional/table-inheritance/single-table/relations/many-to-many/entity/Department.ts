import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {Accountant} from "./Accountant";

@Entity()
export class Department {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Accountant, accountant => accountant.departments)
    accountants: Accountant[];

}
