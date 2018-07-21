import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";

@Entity()
export class PostWithVersion {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @VersionColumn()
    version: number;

}