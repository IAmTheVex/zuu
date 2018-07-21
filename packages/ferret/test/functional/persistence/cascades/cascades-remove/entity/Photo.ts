import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {User} from "./User";
import {Column} from "../../../../../../lib/decorator/columns/Column";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => User, user => user.manyPhotos)
    user: User;

    constructor(name: string) {
        this.name = name;
    }

}