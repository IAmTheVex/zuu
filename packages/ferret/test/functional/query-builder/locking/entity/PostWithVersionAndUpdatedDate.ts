import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";

@Entity("post_with_v_ud")
export class PostWithVersionAndUpdatedDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @VersionColumn()
    version: number;

    @UpdateDateColumn()
    updateDate: Date;

}