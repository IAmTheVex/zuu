import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";
import {Photo} from "./Photo";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {JoinTable} from "../../../../../../lib/decorator/relations/JoinTable";
import {Column} from "../../../../../../lib/decorator/columns/Column";

@Entity()
export class User { // todo: check one-to-one relation as well, but in another model or test

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.user, { cascade: true })
    manyPhotos: Photo[];

    @ManyToMany(type => Photo, { cascade: true })
    @JoinTable()
    manyToManyPhotos: Photo[];

}