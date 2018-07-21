import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ImageInfo} from "./ImageInfo";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => ImageInfo, imageInfo => imageInfo.image)
    informations: ImageInfo[] = [];

}