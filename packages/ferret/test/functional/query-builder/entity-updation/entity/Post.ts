import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {CreateDateColumn} from "../../../../../lib/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @CreateDateColumn()
    createDate: string;

    @UpdateDateColumn()
    updateDate: string;

    @Column({ default: 100 })
    order: number;

    @VersionColumn()
    version: number;

}