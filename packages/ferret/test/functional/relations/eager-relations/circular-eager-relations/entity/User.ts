import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";
import {Profile} from "./Profile";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @OneToOne(type => Profile, profile => profile.user, { eager: true })
    @JoinColumn()
    profile: Profile;

}