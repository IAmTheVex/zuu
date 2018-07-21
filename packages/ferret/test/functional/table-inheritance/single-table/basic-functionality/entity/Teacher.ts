import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ChildEntity} from "../../../../../../lib/decorator/entity/ChildEntity";
import {Employee} from "./Employee";

@ChildEntity()
export class Teacher extends Employee {

    @Column()
    specialization: string;

}
