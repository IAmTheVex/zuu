import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {User} from "./User";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    about: string;

    @OneToOne(type => User, user => user.profile, { eager: true })
    user: User;

}