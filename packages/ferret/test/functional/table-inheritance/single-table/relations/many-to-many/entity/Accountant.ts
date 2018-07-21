import {ChildEntity} from "../../../../../../../lib/decorator/entity/ChildEntity";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {Employee} from "./Employee";
import {Department} from "./Department";

@ChildEntity()
export class Accountant extends Employee {

    @ManyToMany(type => Department, department => department.accountants)
    @JoinTable()
    departments: Department[];

}
