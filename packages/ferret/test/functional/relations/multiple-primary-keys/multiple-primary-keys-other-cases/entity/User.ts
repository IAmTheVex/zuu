import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {EventMember} from "./EventMember";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => EventMember, member => member.user)
    members: EventMember[];

}