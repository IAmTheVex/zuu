import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {User} from "./User";

export class Subcounters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: number;

    @Column()
    watches: number;

    @OneToMany(type => User, user => user.posts)
    watchedUsers: User[];

    watchedUserIds: number[];

}