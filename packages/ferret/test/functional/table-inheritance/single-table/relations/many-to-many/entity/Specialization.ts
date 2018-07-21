import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {Teacher} from "./Teacher";

@Entity()
export class Specialization {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Teacher, teacher => teacher.specializations)
    teachers: Teacher[];

}
