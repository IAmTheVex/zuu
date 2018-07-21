import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {CreateDateColumn} from "../../../../../lib/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";

@Entity()
export class PostSpecialColumns {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;

    @VersionColumn()
    version: number;

}