import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {User} from "./User";

export class Subcounters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToOne(type => User)
    watchedUser: User;

    watchedUserId: number;

}