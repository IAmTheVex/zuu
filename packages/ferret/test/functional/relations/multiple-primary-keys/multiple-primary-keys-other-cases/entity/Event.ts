import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {EventMember} from "./EventMember";
import {Person} from "./Person";

@Entity()
export class Event {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Person)
    author: Person;

    @OneToMany(type => EventMember, member => member.event)
    members: EventMember[];

}