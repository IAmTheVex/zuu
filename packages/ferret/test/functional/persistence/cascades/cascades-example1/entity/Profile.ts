import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {User} from "./User";
import {Photo} from "./Photo";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => User, user => user.profile, {
        nullable: false
    })
    @JoinColumn()
    user: User;

    @OneToOne(type => Photo, {
        nullable: false,
        cascade: ["insert"]
    })
    @JoinColumn()
    photo: Photo;

}