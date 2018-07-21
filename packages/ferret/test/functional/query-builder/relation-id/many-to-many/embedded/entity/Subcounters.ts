import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {User} from "./User";

export class Subcounters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToMany(type => User)
    @JoinTable({ name: "subcnt_users" })
    watchedUsers: User[];

    watchedUserIds: number[];

}