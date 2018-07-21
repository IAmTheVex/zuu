import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {User} from "./User";

export class Subcounters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: number;

    @Column()
    watches: number;

    @OneToOne(type => User)
    @JoinColumn()
    watchedUser: User;

    watchedUserId: number;

}